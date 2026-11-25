import os
from pathlib import Path
from dotenv import load_dotenv

# Prevent transformers from importing broken TensorFlow/tf_keras packages when PyTorch is used
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_TORCH", "1")

APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

DOCUMENTS_DIR = ROOT_DIR / "documents"
DATA_DIR = BACKEND_DIR / "data"
MODEL_DIR = BACKEND_DIR / "model"
DATASETS_DIR = BACKEND_DIR / "datasets"
FAISS_DIR = DATA_DIR / "faiss_index"
UPLOADS_DIR = DATA_DIR / "uploads"

DB_PATH = DATA_DIR / "chatbot.db"
APP_DB_PATH = DATA_DIR / "agrosathi.db"
PROCESSED_LOG_PATH = DATA_DIR / "processed_documents.json"

for _d in (DATA_DIR, MODEL_DIR, DOCUMENTS_DIR, DATASETS_DIR, FAISS_DIR, UPLOADS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# Load environment variables from project root .env (fallback to backend/.env)
if (ROOT_DIR / ".env").exists():
    load_dotenv(ROOT_DIR / ".env", override=True)
elif (BACKEND_DIR / ".env").exists():
    load_dotenv(BACKEND_DIR / ".env", override=True)
else:
    load_dotenv(override=True)

JWT_SECRET = os.getenv("JWT_SECRET", "agrosathi-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "72"))

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{APP_DB_PATH}")

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_DOC_BYTES = 25 * 1024 * 1024    # 25 MB
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".txt", ".md", ".doc", ".docx"}
