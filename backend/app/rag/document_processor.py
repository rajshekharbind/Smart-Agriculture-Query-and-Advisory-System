import logging
import os
import time

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec

from backend.app.config import DOCUMENTS_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Loads, splits, and indexes agricultural documents into Pinecone."""

    def __init__(self, documents_folder: str = str(DOCUMENTS_DIR)):
        self.documents_folder = documents_folder

        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY environment variable is not set.")

        model_name = os.getenv("HUGGINGFACE_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        logger.info("Loading embedding model: %s", model_name)

        self.embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )

        test_embedding = self.embeddings.embed_query("test")
        self.embedding_dimension = len(test_embedding)
        logger.info("Embedding dimension: %d", self.embedding_dimension)

        self.pc = Pinecone(api_key=api_key)
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "smartagri-kb")
        logger.info("Using Pinecone index name: %s", self.index_name)

        existing_indexes = self.pc.list_indexes()
        index_names = [idx["name"] for idx in existing_indexes]

        if self.index_name in index_names:
            existing_index = next(idx for idx in existing_indexes if idx["name"] == self.index_name)
            existing_dim = existing_index["dimension"]
            if existing_dim != self.embedding_dimension:
                raise ValueError(
                    f"Dimension mismatch for index '{self.index_name}': "
                    f"index={existing_dim}, embeddings={self.embedding_dimension}"
                )
            logger.info("Using existing index '%s' (dimension %d)", self.index_name, existing_dim)
        else:
            logger.info("Creating new index '%s' (dimension %d)", self.index_name, self.embedding_dimension)
            self.pc.create_index(
                name=self.index_name,
                dimension=self.embedding_dimension,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region=os.getenv("PINECONE_REGION", "us-east-1"),
                ),
            )
            logger.info("Waiting for index to be ready...")
            time.sleep(10)

        self.index = self.pc.Index(self.index_name)
        stats = self.index.describe_index_stats()
        logger.info("Index stats: %s", stats)

        self.vector_store = PineconeVectorStore(
            index=self.index,
            embedding=self.embeddings,
            text_key="text",
            namespace="",
        )

    def load_document(self, file_path: str):
        """Load a single document based on its extension."""
        ext = os.path.splitext(file_path)[1].lower()
        try:
            if ext == ".pdf":
                loader = PyPDFLoader(file_path)
            elif ext == ".txt":
                loader = TextLoader(file_path, encoding="utf-8")
            elif ext in [".doc", ".docx"]:
                loader = UnstructuredWordDocumentLoader(file_path)
            elif ext == ".md":
                loader = UnstructuredMarkdownLoader(file_path)
            else:
                logger.warning("Unsupported file type: %s", ext)
                return []
            return loader.load()
        except Exception as e:
            logger.error("Error loading %s: %s", file_path, str(e))
            return []

    def process_documents(self):
        """Process all documents in the documents folder."""
        if not os.path.exists(self.documents_folder):
            logger.warning("Documents folder '%s' does not exist", self.documents_folder)
            os.makedirs(self.documents_folder, exist_ok=True)
            return

        all_documents = []
        for root, _, files in os.walk(self.documents_folder):
            for file in files:
                file_path = os.path.join(root, file)
                logger.info("Processing: %s", file_path)
                all_documents.extend(self.load_document(file_path))

        if not all_documents:
            logger.warning("No documents found to process")
            return

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )
        splits = text_splitter.split_documents(all_documents)
        logger.info("Created %d document chunks", len(splits))

        batch_size = 20
        total_batches = (len(splits) + batch_size - 1) // batch_size
        for i in range(0, len(splits), batch_size):
            batch = splits[i : i + batch_size]
            try:
                self.vector_store.add_documents(batch)
                logger.info("Added batch %d/%d", i // batch_size + 1, total_batches)
                time.sleep(0.5)
            except Exception as e:
                logger.error("Error adding batch %d: %s", i // batch_size + 1, e)
                for j, doc in enumerate(batch):
                    try:
                        self.vector_store.add_documents([doc])
                    except Exception as e2:
                        logger.error("Failed to add document %d/%d: %s", i + j + 1, len(splits), e2)

        logger.info("Documents successfully added to Pinecone")

    def clear_index(self):
        """Clear all vectors from the index."""
        try:
            stats = self.index.describe_index_stats()
            if stats.get("total_vector_count", 0) > 0:
                self.index.delete(delete_all=True, namespace="")
                logger.info("Cleared all vectors from Pinecone index")
            else:
                logger.info("Index is already empty")
        except Exception as e:
            logger.warning("Could not clear index: %s", str(e))


if __name__ == "__main__":
    processor = DocumentProcessor()
    processor.process_documents()
