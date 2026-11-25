import logging
import os

os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_TORCH", "1")

import shutil
import sqlite3
import tempfile
import uuid
from typing import Annotated, List, Optional, TypedDict

import speech_recognition as sr
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from pydantic import BaseModel

from backend.app.config import DB_PATH, DOCUMENTS_DIR, LOW_MEMORY_MODE
from backend.app.database import init_db
from backend.app.llm import generate_text, get_llm
from backend.app.rag.local_faiss import list_indexed_documents, search_local_documents
from backend.app.routers import agri_info, ai_tools, auth, documents_voice, farm_ops
from backend.app.security import rate_limit, validate_image_upload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize SQLite tables
init_db()

# -------------------- Lazy Pinecone RAG Setup --------------------
pc = None
index_name = os.getenv("PINECONE_INDEX_NAME", "smartagri-kb")
retriever = None
_pinecone_checked = False


def _get_retriever():
    global pc, retriever, _pinecone_checked
    if _pinecone_checked:
        return retriever
    _pinecone_checked = True

    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    if not pinecone_api_key or LOW_MEMORY_MODE:
        if LOW_MEMORY_MODE and pinecone_api_key:
            logger.info("Low-memory mode active: skipping local PyTorch embeddings at startup; using TF-IDF/Gemini RAG.")
        return None

    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        from langchain_pinecone import PineconeVectorStore
        from pinecone import Pinecone

        pc = Pinecone(api_key=pinecone_api_key)
        model_name = os.getenv("HUGGINGFACE_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        if index_name in pc.list_indexes().names():
            index = pc.Index(index_name)
            vector_store = PineconeVectorStore(
                index=index,
                embedding=embeddings,
                text_key="text",
                namespace="",
            )
            retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        else:
            logger.warning("Pinecone index '%s' not found; using local RAG.", index_name)
    except Exception as e:
        logger.error("Could not initialize Pinecone: %s. Using local RAG.", e)
        retriever = None
    return retriever


# Initialize primary LLM (Gemini / Groq fallback)
llm = get_llm()


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    context: Optional[str]


def retrieve_context(query: str) -> str:
    """Retrieve context from Pinecone if configured (outside low-memory mode), otherwise local RAG."""
    active_retriever = _get_retriever()
    if active_retriever is not None:
        try:
            docs = active_retriever.invoke(query)
            return "\n\n".join([doc.page_content for doc in docs])
        except Exception as e:
            logger.error("Pinecone retrieval error: %s", e)

    try:
        local_matches = search_local_documents(query, k=3)
        if local_matches:
            return "\n\n".join(f"[{m['source']}] {m['content']}" for m in local_matches)
    except Exception as e:
        logger.warning("Local RAG retrieval skipped: %s", e)
    return ""


def chat_node(state: ChatState):
    messages = state["messages"]
    active_llm = get_llm()

    if active_llm is None:
        return {
            "messages": [
                AIMessage(
                    content=(
                        "GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY to the `.env` file "
                        "in the project root and restart the backend server."
                    )
                )
            ],
            "context": "",
        }

    last_human_msg = None
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            last_human_msg = msg.content
            break

    if last_human_msg:
        context = retrieve_context(last_human_msg)
        base_role = (
            "You are AgroSathi AI (Digital Krishi Officer), a practical, trustworthy agricultural advisor for Indian farmers. "
            "Use simple, respectful language. Recommend organic/IPM solutions alongside safe chemical precautions, "
            "and advise consulting local Krishi Vigyan Kendra (KVK) / Krishi Bhavan officers for severe crop issues."
        )
        system_content = (
            f"{base_role}\n\nRelevant Agricultural Knowledge Context:\n{context}"
            if context
            else base_role
        )

        system_msg = SystemMessage(content=system_content)
        chat_history = messages[-10:] if len(messages) > 10 else messages
        llm_messages = [system_msg] + chat_history

        try:
            response = active_llm.invoke(llm_messages)
            return {"messages": [response], "context": context}
        except Exception as e:
            logger.error("LLM invoke error: %s", e)
            return {"messages": [AIMessage(content=f"Sorry, I encountered an error: {str(e)}")]}

    return {"messages": [AIMessage(content="I didn't receive a message to respond to.")]}


# -------------------- SQLite & LangGraph Setup --------------------
conn = sqlite3.connect(database=str(DB_PATH), check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_edge(START, "chat_node")
graph.add_edge("chat_node", END)
chatbot = graph.compile(checkpointer=checkpointer)

# -------------------- FastAPI Setup --------------------
app = FastAPI(
    title="AgroSathi AI — Smart Agricultural Assistance Platform",
    version="2.0.0",
)
raw_origins = os.getenv("ALLOWED_ORIGINS", "*").strip()
allowed_origins = (
    ["*"]
    if raw_origins == "*"
    else [o.strip() for o in raw_origins.split(",") if o.strip()]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allowed_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(auth.router)
app.include_router(ai_tools.router)
app.include_router(agri_info.router)
app.include_router(farm_ops.router)
app.include_router(documents_voice.router)


# -------------------- Pydantic Models --------------------
class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    thread_id: Optional[str] = None
    messages: List[Message]
    language: Optional[str] = "Hindi"


class NewThreadResponse(BaseModel):
    thread_id: str


class ThreadListResponse(BaseModel):
    threads: List[str]


class DocumentListResponse(BaseModel):
    documents: List[str]


class ProcessingStatusResponse(BaseModel):
    total_documents: int
    processed_chunks: int


# -------------------- Utility Functions --------------------
def generate_thread_id() -> str:
    return str(uuid.uuid4())


def retrieve_all_threads() -> List[str]:
    try:
        cursor = conn.execute("SELECT DISTINCT thread_id FROM checkpoints")
        return [row[0] for row in cursor.fetchall()]
    except Exception as e:
        logger.warning("Failed to list threads directly from SQLite: %s", e)
        return []


def convert_messages(messages: List[Message]) -> List[BaseMessage]:
    converted: List[BaseMessage] = []
    for m in messages:
        if m.role == "user":
            converted.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            converted.append(AIMessage(content=m.content))
        elif m.role == "system":
            converted.append(SystemMessage(content=m.content))
    return converted


# -------------------- Core Endpoints --------------------
@app.get("/")
@app.get("/health")
def health_check():
    faiss_info = list_indexed_documents()
    pinecone_configured = bool(os.getenv("PINECONE_API_KEY"))
    return {
        "status": "ok",
        "service": "AgroSathi AI — Smart Agricultural Assistance API",
        "llm_configured": get_llm() is not None,
        "rag_enabled": pinecone_configured or faiss_info["total_chunks"] > 0,
        "low_memory_mode": LOW_MEMORY_MODE,
        "local_faiss_chunks": faiss_info["total_chunks"],
    }


@app.post("/voice_query", dependencies=[Depends(rate_limit(30, 60))])
async def voice_query(file: UploadFile = File(...), language: str = Form("Hindi")):
    """Accept a voice query (WAV audio), transcribe it, and return the chatbot answer."""
    temp_audio_path = None
    try:
        suffix = os.path.splitext(file.filename or "audio.wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            shutil.copyfileobj(file.file, temp_audio)
            temp_audio_path = temp_audio.name

        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_audio_path) as source:
            audio_data = recognizer.record(source)
            lang_code = {
                "Hindi": "hi-IN",
                "Malayalam": "ml-IN",
                "English": "en-IN",
                "Marathi": "mr-IN",
                "Tamil": "ta-IN",
                "Telugu": "te-IN",
                "Kannada": "kn-IN",
                "Bengali": "bn-IN",
                "Gujarati": "gu-IN",
                "Punjabi": "pa-IN",
                "Spanish": "es-ES",
                "French": "fr-FR",
                "German": "de-DE",
                "Chinese": "zh-CN",
                "Arabic": "ar-SA",
            }.get(language, "hi-IN")
            try:
                query_text = recognizer.recognize_google(audio_data, language=lang_code)
            except Exception as e:
                return {"answer": f"Could not transcribe audio: {str(e)}"}

        thread_id = str(uuid.uuid4())
        messages = [HumanMessage(content=f"{query_text}\n(Please respond simply in {language}.)")]
        config = {"configurable": {"thread_id": thread_id}}
        response = chatbot.invoke({"messages": messages}, config=config)
        ai_messages = [m for m in response["messages"] if isinstance(m, AIMessage)]
        answer = ai_messages[-1].content if ai_messages else "No answer generated."
        return {"answer": answer, "transcription": query_text}
    except Exception as e:
        return {"answer": f"Voice query failed: {str(e)}"}
    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)


@app.get("/threads", response_model=ThreadListResponse)
def get_all_threads():
    return ThreadListResponse(threads=retrieve_all_threads())


@app.post("/new_thread", response_model=NewThreadResponse)
def new_thread():
    return NewThreadResponse(thread_id=generate_thread_id())


@app.get("/load_thread/{thread_id}", response_model=List[Message])
def load_thread(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    messages = []
    try:
        state = chatbot.get_state(config=config)
        if state and state.values:
            messages = state.values.get("messages", [])
    except (KeyError, NotImplementedError) as e:
        logger.warning("Falling back to raw checkpoint for thread %s: %s", thread_id, e)
        try:
            saved = checkpointer.get_tuple(config)
            if saved and saved.checkpoint:
                messages = saved.checkpoint.get("channel_values", {}).get("messages", [])
        except Exception as inner_e:
            logger.warning("Could not read legacy checkpoint for thread %s: %s", thread_id, inner_e)
            return []
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread {thread_id} not found: {str(e)}")

    formatted = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            role = "user"
        elif isinstance(msg, AIMessage):
            role = "assistant"
        elif isinstance(msg, SystemMessage):
            role = "system"
        else:
            continue
        formatted.append({"role": role, "content": msg.content})
    return formatted


@app.post("/chat", response_model=List[Message], dependencies=[Depends(rate_limit(60, 60))])
def chat_endpoint(request: ChatRequest):
    thread_id = request.thread_id or generate_thread_id()
    config = {"configurable": {"thread_id": thread_id}}

    all_messages = convert_messages(request.messages)
    if request.language and request.language.lower() != "english":
        all_messages.append(HumanMessage(content=f"Please respond in {request.language}."))

    try:
        response = chatbot.invoke({"messages": all_messages}, config=config)
        ai_messages = [
            {"role": "assistant", "content": msg.content}
            for msg in response["messages"]
            if isinstance(msg, AIMessage)
        ]
        return [ai_messages[-1]] if ai_messages else []
    except Exception as e:
        logger.error("Chat endpoint error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents", response_model=DocumentListResponse)
def get_documents():
    try:
        if DOCUMENTS_DIR.exists():
            documents = [p.name for p in DOCUMENTS_DIR.iterdir() if p.is_file()]
            return DocumentListResponse(documents=documents)
        return DocumentListResponse(documents=[])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/processing_status", response_model=ProcessingStatusResponse)
def get_processing_status():
    try:
        faiss_info = list_indexed_documents()
        total_docs = faiss_info["total_documents"]
        processed_chunks = faiss_info["total_chunks"]

        if retriever and pc and index_name in pc.list_indexes().names():
            index = pc.Index(index_name)
            stats = index.describe_index_stats()
            processed_chunks = max(processed_chunks, stats.get("total_vector_count", 0))

        return ProcessingStatusResponse(
            total_documents=total_docs,
            processed_chunks=processed_chunks,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict-disease/", dependencies=[Depends(rate_limit(30, 60))])
async def predict_disease(
    file: UploadFile = File(...),
    language: str = Form("Hindi"),
):
    content, ext, quality = await validate_image_upload(file)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        from backend.app.models.prediction import PredictionPipeline

        pipeline = PredictionPipeline(temp_path)
        result = pipeline.predict()
        top_label = result[0]["image"]
        confidence = max(result[0]["probabilities"]) if result[0]["probabilities"] else 0.0

        ai_guidance = generate_text(
            f"A crop leaf image classifier suggests possible condition '{top_label}' (score {confidence:.2%}). "
            f"Do NOT diagnose definitively. Explain in simple {language}: 1) Symptoms to verify on the plant, "
            "2) Safe precautionary/organic steps, 3) Reminder to consult local Krishi Vigyan Kendra / Krishi Bhavan."
        )

        return {
            "prediction": top_label,
            "probabilities": result[0]["probabilities"],
            "top_predictions": result[0].get("top_predictions", []),
            "model_source": result[0].get("model_source", "custom"),
            "quality": quality,
            "ai_guidance": ai_guidance,
            "disclaimer": (
                "Precautionary Notice: AI image predictions are assistive only and not a definitive laboratory diagnosis. "
                "Please confirm serious crop symptoms with a qualified agronomist or local Krishi Bhavan before applying chemical treatments."
            ),
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/upload_document")
async def upload_document(file: UploadFile = File(...)):
    """Backward-compatible upload endpoint that also indexes into local FAISS."""
    from backend.app.rag.local_faiss import ingest_document
    from backend.app.security import validate_document_upload

    content, filename = await validate_document_upload(file)
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = DOCUMENTS_DIR / filename
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    try:
        info = ingest_document(file_path)
        return {
            "message": f"Document {filename} uploaded and indexed ({info.get('chunks', 0)} chunks).",
            "indexed": True,
        }
    except Exception as e:
        logger.warning("Local FAISS ingest error for %s: %s", filename, e)
        return {"message": f"Document {filename} saved locally in documents/.", "indexed": False}


@app.post("/sync_documents")
def sync_documents():
    from backend.app.rag.local_faiss import ingest_document, list_indexed_documents

    info = list_indexed_documents()
    synced = 0
    for doc in info["documents"]:
        if not doc["indexed"]:
            res = ingest_document(DOCUMENTS_DIR / doc["filename"])
            if res.get("chunks", 0) > 0:
                synced += 1
    return {"message": f"Indexed {synced} new document(s) into local FAISS knowledge base."}


@app.post("/reindex_documents")
def reindex_documents():
    from backend.app.rag.local_faiss import ingest_document

    count = 0
    for p in DOCUMENTS_DIR.iterdir():
        if p.is_file() and p.suffix.lower() in {".pdf", ".txt", ".md", ".docx"}:
            res = ingest_document(p)
            if res.get("chunks", 0) > 0:
                count += 1
    return {"message": f"Reindexed {count} document(s) into local FAISS knowledge base."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
