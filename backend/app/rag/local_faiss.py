import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.config import DATA_DIR, DOCUMENTS_DIR, FAISS_DIR, LOW_MEMORY_MODE
from backend.app.llm import generate_text

logger = logging.getLogger(__name__)

META_FILE = DATA_DIR / "local_faiss_docs.json"
TFIDF_CHUNKS_FILE = DATA_DIR / "local_tfidf_chunks.json"
_embeddings = None
_vector_store = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings

        model_name = os.getenv("HUGGINGFACE_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        logger.info("Initializing local FAISS embeddings: %s", model_name)
        _embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def _load_meta() -> Dict[str, Any]:
    if META_FILE.exists():
        with open(META_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_meta(meta: Dict[str, Any]):
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)


def _load_tfidf_chunks() -> List[Dict[str, Any]]:
    if TFIDF_CHUNKS_FILE.exists():
        with open(TFIDF_CHUNKS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_tfidf_chunks(chunks: List[Dict[str, Any]]):
    with open(TFIDF_CHUNKS_FILE, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2)


def _get_vector_store():
    global _vector_store
    if LOW_MEMORY_MODE:
        return None
    if _vector_store is not None:
        return _vector_store
    index_file = FAISS_DIR / "index.faiss"
    if index_file.exists():
        try:
            from langchain_community.vectorstores import FAISS

            _vector_store = FAISS.load_local(
                str(FAISS_DIR),
                _get_embeddings(),
                allow_dangerous_deserialization=True,
            )
            return _vector_store
        except Exception as e:
            logger.error("Failed to load local FAISS index: %s", e)
    return None


def extract_text_from_file(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    if ext == ".pdf":
        reader = PdfReader(str(file_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages).strip()
    if ext in {".txt", ".md"}:
        return file_path.read_text(encoding="utf-8", errors="ignore").strip()
    if ext in {".docx", ".doc"}:
        try:
            import docx2txt
            return (docx2txt.process(str(file_path)) or "").strip()
        except Exception as e:
            logger.warning("docx2txt extraction failed: %s", e)
            return ""
    return ""


def ingest_document(file_path: Path) -> Dict[str, Any]:
    global _vector_store
    text = extract_text_from_file(file_path)
    if not text:
        return {"filename": file_path.name, "chunks": 0, "chars": 0, "status": "empty_or_unreadable"}

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900,
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_text(text)

    if LOW_MEMORY_MODE:
        existing = [c for c in _load_tfidf_chunks() if c.get("source") != file_path.name]
        for i, ch in enumerate(chunks):
            existing.append({"source": file_path.name, "chunk": i, "content": ch})
        _save_tfidf_chunks(existing)
    else:
        from langchain_community.vectorstores import FAISS

        metadatas = [{"source": file_path.name, "chunk": i} for i in range(len(chunks))]
        embeddings = _get_embeddings()
        vs = _get_vector_store()
        if vs is None:
            vs = FAISS.from_texts(chunks, embeddings, metadatas=metadatas)
        else:
            vs.add_texts(chunks, metadatas=metadatas)
        vs.save_local(str(FAISS_DIR))
        _vector_store = vs

    meta = _load_meta()
    meta[file_path.name] = {
        "filename": file_path.name,
        "chunks": len(chunks),
        "chars": len(text),
        "preview": text[:400],
        "indexed_at": datetime.utcnow().isoformat(),
    }
    _save_meta(meta)
    return meta[file_path.name]


def list_indexed_documents() -> Dict[str, Any]:
    meta = _load_meta()
    files_on_disk = []
    if DOCUMENTS_DIR.exists():
        for p in sorted(DOCUMENTS_DIR.iterdir()):
            if p.is_file():
                info = meta.get(p.name, {})
                files_on_disk.append(
                    {
                        "filename": p.name,
                        "size_kb": round(p.stat().st_size / 1024, 1),
                        "indexed": p.name in meta,
                        "chunks": info.get("chunks", 0),
                        "indexed_at": info.get("indexed_at"),
                    }
                )
    total_chunks = sum(item["chunks"] for item in files_on_disk)
    return {"documents": files_on_disk, "total_documents": len(files_on_disk), "total_chunks": total_chunks}


def search_local_documents(query: str, k: int = 5) -> List[Dict[str, Any]]:
    if LOW_MEMORY_MODE:
        rows = _load_tfidf_chunks()
        if not rows:
            return []
        corpus = [r["content"] for r in rows]
        vec = TfidfVectorizer(stop_words="english")
        mat = vec.fit_transform(corpus + [query])
        sims = cosine_similarity(mat[-1], mat[:-1])[0]
        top_idx = sims.argsort()[::-1][:k]
        return [
            {
                "source": rows[i]["source"],
                "chunk": rows[i]["chunk"],
                "score": round(float(sims[i]), 4),
                "content": rows[i]["content"],
            }
            for i in top_idx
            if sims[i] > 0.01
        ]

    vs = _get_vector_store()
    if vs is None:
        return []
    docs = vs.similarity_search_with_score(query, k=k)
    return [
        {
            "source": doc.metadata.get("source", "unknown"),
            "chunk": doc.metadata.get("chunk", 0),
            "score": round(float(score), 4),
            "content": doc.page_content,
        }
        for doc, score in docs
    ]


def summarize_local_document(filename: str, language: str = "Hindi") -> Dict[str, Any]:
    file_path = DOCUMENTS_DIR / Path(filename).name
    if not file_path.exists():
        raise FileNotFoundError(f"Document '{filename}' not found in documents/.")

    text = extract_text_from_file(file_path)
    if not text:
        raise ValueError(f"Could not extract readable text from '{filename}'.")

    excerpt = text[:12000]
    prompt = (
        f"Summarize this agricultural document '{file_path.name}' clearly in {language} for an Indian farmer. "
        "Include:\n1. Main topic & purpose\n2. 5 key actionable takeaways\n3. Any dosage/eligibility/deadline numbers found.\n\n"
        f"Document text:\n{excerpt}"
    )
    summary = generate_text(prompt) or f"Extracted {len(text)} characters from {file_path.name}. Preview:\n\n{text[:1000]}"
    return {
        "filename": file_path.name,
        "chars": len(text),
        "language": language,
        "summary": summary,
    }


def ask_local_documents(question: str, language: str = "Hindi") -> Dict[str, Any]:
    if not LOW_MEMORY_MODE and _get_vector_store() is None:
        for p in DOCUMENTS_DIR.iterdir():
            if p.is_file() and p.suffix.lower() in {".txt", ".md", ".pdf"}:
                try:
                    ingest_document(p)
                except Exception as e:
                    logger.warning("Auto-index skipped %s: %s", p.name, e)
    elif LOW_MEMORY_MODE and not _load_tfidf_chunks():
        for p in DOCUMENTS_DIR.iterdir():
            if p.is_file() and p.suffix.lower() in {".txt", ".md"}:
                try:
                    ingest_document(p)
                except Exception as e:
                    logger.warning("Auto-index skipped %s: %s", p.name, e)

    matches = search_local_documents(question, k=4)
    context = "\n\n".join(f"[{m['source']}] {m['content']}" for m in matches)

    if context:
        prompt = (
            f"Answer the farmer's question using ONLY the retrieved agricultural document excerpts below. "
            f"If the excerpts do not contain the answer, clearly say so. Respond in simple {language}.\n\n"
            f"Excerpts:\n{context}\n\nQuestion: {question}"
        )
    else:
        prompt = (
            f"No indexed documents matched yet. Answer concisely in {language} and mention that uploading relevant PDFs "
            f"to the PDF Assistant enables grounded document Q&A.\n\nQuestion: {question}"
        )

    answer = generate_text(prompt) or (
        "LLM key is not configured. Top matching excerpts:\n\n" + context[:1500]
        if context
        else "No matching document excerpts found."
    )
    return {
        "question": question,
        "language": language,
        "answer": answer,
        "sources": matches,
    }


def _pdf_escape(text: str) -> str:
    safe = text.encode("latin-1", errors="replace").decode("latin-1")
    return safe.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def generate_pdf_report(title: str, sections: List[Dict[str, str]]) -> bytes:
    """Pure-Python valid PDF 1.4 generator for downloadable agriculture reports."""
    lines: List[str] = [title, "=" * min(65, len(title)), f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ""]
    for sec in sections:
        heading = sec.get("heading", "").strip()
        body = sec.get("body", "").strip()
        if heading:
            lines.append(heading)
            lines.append("-" * min(55, len(heading)))
        for raw_line in body.splitlines():
            words = raw_line.split()
            if not words:
                lines.append("")
                continue
            current = ""
            for w in words:
                if len(current) + len(w) + 1 > 84:
                    lines.append(current)
                    current = w
                else:
                    current = f"{current} {w}".strip()
            if current:
                lines.append(current)
        lines.append("")

    page_size = 46
    pages = [lines[i : i + page_size] for i in range(0, len(lines), page_size)] or [["AgroSathi AI Report"]]

    objects: List[bytes] = []
    page_obj_ids = []
    next_id = 4
    content_objs = []
    for pg in pages:
        content_lines = ["BT", "/F1 10 Tf", "50 790 Td", "15 TL"]
        for idx, line in enumerate(pg):
            escaped = _pdf_escape(line)
            if idx == 0:
                content_lines.append(f"({escaped}) Tj")
            else:
                content_lines.append(f"T* ({escaped}) Tj")
        content_lines.append("ET")
        stream_data = "\n".join(content_lines).encode("latin-1")
        page_id = next_id
        content_id = next_id + 1
        next_id += 2
        page_obj_ids.append(page_id)
        content_objs.append((page_id, content_id, stream_data))

    kids_str = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append(f"2 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {len(page_obj_ids)} >>\nendobj\n".encode("latin-1"))
    objects.append(b"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    for page_id, content_id, stream_data in content_objs:
        objects.append(
            f"{page_id} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents {content_id} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n".encode("latin-1")
        )
        objects.append(
            f"{content_id} 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode("latin-1")
            + stream_data
            + b"\nendstream\nendobj\n"
        )

    pdf_parts = [b"%PDF-1.4\n"]
    offsets = [0]
    for obj in objects:
        offsets.append(sum(len(p) for p in pdf_parts))
        pdf_parts.append(obj)

    xref_pos = sum(len(p) for p in pdf_parts)
    xref = [f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin-1")]
    for off in offsets[1:]:
        xref.append(f"{off:010d} 00000 n \n".encode("latin-1"))
    trailer = f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin-1")

    return b"".join(pdf_parts + xref + [trailer])
