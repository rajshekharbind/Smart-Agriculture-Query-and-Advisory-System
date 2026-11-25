import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import DOCUMENTS_DIR
from backend.app.rag.document_processor import DocumentProcessor


def initialize_knowledge_base():
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

    if not any(DOCUMENTS_DIR.iterdir()):
        sample_file = DOCUMENTS_DIR / "sample.txt"
        with open(sample_file, "w", encoding="utf-8") as f:
            f.write(
                """Welcome to the SmartAgri-AI Knowledge Base.

This is a sample document. Please add your agricultural documents, research papers,
and advisory materials to the documents/ folder.

Supported formats:
- PDF (.pdf)
- Text files (.txt)
- Word documents (.doc, .docx)
- Markdown files (.md)
"""
            )
        print("Created sample document in documents folder")

    print("Initializing knowledge base...")
    processor = DocumentProcessor()

    try:
        processor.clear_index()
    except Exception as e:
        print(f"Note: Could not clear existing index: {e}")

    processor.process_documents()
    print("Knowledge base initialized successfully!")


if __name__ == "__main__":
    initialize_knowledge_base()
