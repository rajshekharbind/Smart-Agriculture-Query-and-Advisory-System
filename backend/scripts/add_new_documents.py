from datetime import datetime
import json
import logging
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.app.config import DOCUMENTS_DIR, PROCESSED_LOG_PATH
from backend.app.rag.document_processor import DocumentProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_processed_files():
    """Load the list of already processed files."""
    if PROCESSED_LOG_PATH.exists():
        with open(PROCESSED_LOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_processed_files(processed_files):
    """Save the list of processed files."""
    PROCESSED_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(processed_files, f, indent=2)


def get_new_documents(documents_folder: str = str(DOCUMENTS_DIR)):
    """Get list of documents that haven't been processed yet."""
    processed_files = load_processed_files()
    new_documents = []

    for root, _, files in os.walk(documents_folder):
        for file in files:
            file_path = os.path.join(root, file)
            file_stat = os.stat(file_path)
            if (
                file_path not in processed_files
                or processed_files[file_path]["modified"] < file_stat.st_mtime
            ):
                new_documents.append(file_path)

    return new_documents


def process_new_documents():
    """Process only new or modified documents."""
    new_docs = get_new_documents()
    if not new_docs:
        logger.info("No new documents to process!")
        return

    logger.info("Found %d new/modified documents to process:", len(new_docs))
    for doc in new_docs:
        logger.info("  - %s", doc)

    processor = DocumentProcessor()
    processed_files = load_processed_files()

    for doc_path in new_docs:
        try:
            logger.info("Processing: %s", doc_path)
            documents = processor.load_document(doc_path)
            if documents:
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                    length_function=len,
                    separators=["\n\n", "\n", " ", ""],
                )
                splits = text_splitter.split_documents(documents)
                processor.vector_store.add_documents(splits)

                file_stat = os.stat(doc_path)
                processed_files[doc_path] = {
                    "processed_at": datetime.now().isoformat(),
                    "modified": file_stat.st_mtime,
                    "chunks": len(splits),
                }
                logger.info("Successfully processed %s (%d chunks)", doc_path, len(splits))
        except Exception as e:
            logger.error("Error processing %s: %s", doc_path, e)

    save_processed_files(processed_files)
    logger.info("Document processing complete!")


if __name__ == "__main__":
    process_new_documents()
