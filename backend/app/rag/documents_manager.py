from datetime import datetime
import json
import logging
import os
import sys
from typing import Dict, List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from backend.app.config import DOCUMENTS_DIR, PROCESSED_LOG_PATH
from backend.app.rag.document_processor import DocumentProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentManager:
    """Tracks processed documents and incrementally syncs updates to Pinecone."""

    def __init__(
        self,
        documents_folder: str = str(DOCUMENTS_DIR),
        log_file: str = str(PROCESSED_LOG_PATH),
    ):
        self.documents_folder = documents_folder
        self.log_file = log_file
        self.processor = DocumentProcessor(documents_folder=self.documents_folder)

    def get_processed_documents(self) -> Dict:
        """Get dictionary of all processed documents."""
        if os.path.exists(self.log_file):
            with open(self.log_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def add_single_document(self, file_path: str) -> bool:
        """Add a single document to the vector store."""
        try:
            logger.info("Adding document: %s", file_path)
            documents = self.processor.load_document(file_path)
            if not documents:
                logger.error("Could not load document: %s", file_path)
                return False

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
            )
            splits = text_splitter.split_documents(documents)
            self.processor.vector_store.add_documents(splits)

            processed = self.get_processed_documents()
            file_stat = os.stat(file_path)
            processed[file_path] = {
                "processed_at": datetime.now().isoformat(),
                "modified": file_stat.st_mtime,
                "chunks": len(splits),
            }

            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
            with open(self.log_file, "w", encoding="utf-8") as f:
                json.dump(processed, f, indent=2)

            logger.info("Successfully added %s (%d chunks)", file_path, len(splits))
            return True
        except Exception as e:
            logger.error("Error adding document %s: %s", file_path, e)
            return False

    def remove_document(self, file_path: str):
        """Remove a document from the vector store (requires storing vector IDs)."""
        logger.warning("Document removal not implemented - would require storing vector IDs")

    def list_documents(self) -> List[Dict]:
        """List all documents and their processing status."""
        processed = self.get_processed_documents()
        all_docs = []

        if not os.path.exists(self.documents_folder):
            return all_docs

        for root, _, files in os.walk(self.documents_folder):
            for file in files:
                file_path = os.path.join(root, file)
                file_stat = os.stat(file_path)
                doc_info = {
                    "path": file_path,
                    "size": file_stat.st_size,
                    "modified": datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                }
                if file_path in processed:
                    doc_info["status"] = "processed"
                    doc_info["processed_at"] = processed[file_path]["processed_at"]
                    doc_info["chunks"] = processed[file_path]["chunks"]
                else:
                    doc_info["status"] = "pending"
                all_docs.append(doc_info)

        return all_docs

    def sync_documents(self) -> int:
        """Sync all new and modified documents."""
        processed = self.get_processed_documents()
        new_count = 0

        if not os.path.exists(self.documents_folder):
            return new_count

        for root, _, files in os.walk(self.documents_folder):
            for file in files:
                file_path = os.path.join(root, file)
                file_stat = os.stat(file_path)
                if (
                    file_path not in processed
                    or processed[file_path]["modified"] < file_stat.st_mtime
                ):
                    if self.add_single_document(file_path):
                        new_count += 1

        logger.info("Sync complete! Processed %d new/modified documents", new_count)
        return new_count


if __name__ == "__main__":
    manager = DocumentManager()
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m backend.app.rag.documents_manager list        - List all documents")
        print("  python -m backend.app.rag.documents_manager sync        - Process new/modified documents")
        print("  python -m backend.app.rag.documents_manager add <file>  - Add specific document")
        sys.exit(1)

    command = sys.argv[1]
    if command == "list":
        docs = manager.list_documents()
        print(f"\nTotal documents: {len(docs)}")
        for doc in docs:
            status = "✓" if doc["status"] == "processed" else "○"
            print(f"{status} {doc['path']} ({doc.get('chunks', 0)} chunks)")
    elif command == "sync":
        count = manager.sync_documents()
        print(f"Processed {count} new/modified documents")
    elif command == "add" and len(sys.argv) > 2:
        file_path = sys.argv[2]
        print(f"Successfully added {file_path}" if manager.add_single_document(file_path) else f"Failed to add {file_path}")
    else:
        print("Invalid command")
