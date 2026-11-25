import io
from typing import Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response, StreamingResponse
from gtts import gTTS
from pydantic import BaseModel, Field

from backend.app.config import DOCUMENTS_DIR
from backend.app.rag.local_faiss import (
    ask_local_documents,
    generate_pdf_report,
    ingest_document,
    list_indexed_documents,
    search_local_documents,
    summarize_local_document,
)
from backend.app.security import rate_limit, validate_document_upload

router = APIRouter(prefix="/api", tags=["PDF RAG & Voice TTS"])

TTS_LANG_CODES = {
    "Hindi": "hi",
    "English": "en",
    "Malayalam": "ml",
    "Marathi": "mr",
    "Tamil": "ta",
    "Telugu": "te",
    "Kannada": "kn",
    "Bengali": "bn",
    "Gujarati": "gu",
    "Punjabi": "pa",
}


class PdfAskRequest(BaseModel):
    question: str = Field(..., min_length=2)
    language: str = "Hindi"


class PdfSummaryRequest(BaseModel):
    filename: str
    language: str = "Hindi"


class PdfReportRequest(BaseModel):
    title: str = "AgroSathi AI Agriculture Report"
    sections: List[Dict[str, str]]


class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2500)
    language: str = "Hindi"


@router.get("/pdf/list")
def api_pdf_list():
    return list_indexed_documents()


@router.post("/pdf/upload", dependencies=[Depends(rate_limit(20, 60))])
async def api_pdf_upload(file: UploadFile = File(...)):
    content, filename = await validate_document_upload(file)
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = DOCUMENTS_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)

    try:
        info = ingest_document(file_path)
        return {"message": f"Uploaded and indexed '{filename}' into local FAISS.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Uploaded file saved, but indexing failed: {e}")


@router.get("/pdf/search")
def api_pdf_search(q: str = Query(..., min_length=2)):
    matches = search_local_documents(q, k=5)
    return {"query": q, "matches": matches}


@router.post("/pdf/summarize", dependencies=[Depends(rate_limit(20, 60))])
def api_pdf_summarize(payload: PdfSummaryRequest):
    try:
        return summarize_local_document(payload.filename, payload.language)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf/ask", dependencies=[Depends(rate_limit(30, 60))])
def api_pdf_ask(payload: PdfAskRequest):
    return ask_local_documents(payload.question, payload.language)


@router.post("/pdf/report")
def api_pdf_report(payload: PdfReportRequest):
    pdf_bytes = generate_pdf_report(payload.title, payload.sections)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="agrosathi-report.pdf"'},
    )


@router.post("/voice/tts", dependencies=[Depends(rate_limit(30, 60))])
def api_voice_tts(payload: TtsRequest):
    lang_code = TTS_LANG_CODES.get(payload.language, "hi")
    try:
        clean_text = payload.text.replace("*", "").replace("#", "").strip()
        tts = gTTS(text=clean_text[:1500], lang=lang_code, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-speech failed: {e}")
