# AgroSathi AI — Smart Agricultural Assistance Platform (एग्रोसाथी AI)

A full-stack, mobile-first AI agricultural assistance platform designed for Indian farmers — supporting **Easy Mode** (simple Hindi-first navigation, voice input, audio playback) and **Expert Mode** (ML analytics, soil reports, PDF exports), with **Dark & Light Themes**.

## Live Deployment & URLs

- **Live Frontend (Vercel):** https://smart-agriculture-query-and-advisor.vercel.app/
- **Backend API (Render):** Configured via [render.yaml](render.yaml) (e.g., `https://agrosathi-backend.onrender.com`, Swagger Docs at `/docs`, Health Check at `/health`)
- **Local Frontend:** `http://localhost:5173`
- **Local Backend API:** `http://localhost:8000` (`http://localhost:8000/docs`)

Home-Page
<img width="1903" height="975" alt="image" src="https://github.com/user-attachments/assets/f050b248-0a01-42c8-834e-bf1a3d2b9acb" />
<img width="1897" height="967" alt="image" src="https://github.com/user-attachments/assets/d0f331aa-3f2a-41c2-b72e-6310371cdf6a" />
<img width="1893" height="978" alt="image" src="https://github.com/user-attachments/assets/d707fe7e-7a31-4712-8c53-eb9eb15827f9" />
<img width="1902" height="971" alt="image" src="https://github.com/user-attachments/assets/76ca7a25-aae9-4d36-be3b-a860d6d32e65" />
<img width="1907" height="977" alt="image" src="https://github.com/user-attachments/assets/240d1752-233b-4e19-8dea-8d6da7120b29" />
<img width="1903" height="951" alt="image" src="https://github.com/user-attachments/assets/29e6e8c7-46e9-40a2-9575-6d6acb7f7088" />
<img width="1911" height="982" alt="image" src="https://github.com/user-attachments/assets/d2c02a79-a6f7-437d-8c7e-26140db633c8" />
<img width="1901" height="943" alt="image" src="https://github.com/user-attachments/assets/90ced9f9-7662-4cfa-a28d-ac358b322680" />
<img width="1876" height="975" alt="image" src="https://github.com/user-attachments/assets/e609ec5f-e2b3-4541-8f87-982db9f5382b" />
<img width="1886" height="981" alt="image" src="https://github.com/user-attachments/assets/2b8ee3b1-a000-49a8-8149-ffbd21d4e463" />
<img width="1907" height="980" alt="image" src="https://github.com/user-attachments/assets/c24ea728-2d54-4e66-8062-552a5c8697e6" />
<img width="1886" height="975" alt="image" src="https://github.com/user-attachments/assets/7d8e52b5-b41f-4599-a546-7394797a31a6" />
<img width="1897" height="967" alt="image" src="https://github.com/user-attachments/assets/b9b67a58-c0ee-471e-99ac-164a43068430" />
<img width="1888" height="947" alt="image" src="https://github.com/user-attachments/assets/11e1139e-f0b2-413a-8b23-74e46f3972a8" />
<img width="1900" height="937" alt="image" src="https://github.com/user-attachments/assets/03846616-ca86-43b2-8494-21008e19cbda" />
<img width="1897" height="967" alt="image" src="https://github.com/user-attachments/assets/ff9e702b-12a5-4c2a-ab37-c36368ff4bb7" />
<img width="1862" height="951" alt="image" src="https://github.com/user-attachments/assets/ae49dfb2-1aa9-4b99-b0dd-8423c2bd351f" />
<img width="1882" height="927" alt="image" src="https://github.com/user-attachments/assets/3ff6d562-a62f-4236-bee8-5112f725fe51" />
<img width="1897" height="976" alt="image" src="https://github.com/user-attachments/assets/313a8269-ac75-49ca-90f2-d88880022604" />


## Technology Stack

### Frontend
- **Framework:** React 19 + Vite 7
- **Styling & UI:** Tailwind CSS 3 (Dark & Light Themes, Glassmorphism, Mobile-First Drawer & Easy/Expert Modes)
- **Icons & HTTP:** `lucide-react`, `react-icons`, Axios
- **Browser APIs:** Web Audio API (16-bit PCM WAV voice recording), MediaDevices `getUserMedia` (live camera capture)

### Backend & Security
- **API Framework:** FastAPI + Uvicorn (modular routers for Auth, AI Tools, Agri Info, Farm Ops, PDF/Voice)
- **Orchestration & Workflows:** LangGraph (`StateGraph` + `SqliteSaver` persistent chat checkpoints), LangChain
- **Database:** SQLite (`agrosathi.db`, `chatbot.db`) locally; PostgreSQL-ready (`psycopg2-binary`, `docker-compose.yml`)
- **Security:** JWT authentication (`PyJWT`), `bcrypt` password hashing, per-IP sliding-window rate limiting, file extension/size & OpenCV image validation

### AI, ML Models & Data Stack

| Capability | Model / Engine | Dataset / Source | Details |
| :--- | :--- | :--- | :--- |
| **AI Chat & Advisory** | Google **Gemini 2.5 Flash** (`google-genai`) + optional **Groq** fallback | Live prompt + RAG context | Multi-language responses (Hindi, English, Malayalam, Marathi, Tamil, Telugu, etc.) |
| **Crop Recommendation** | `RandomForestClassifier` (`scikit-learn` / `crop_recommender.joblib`) | `crop_recommendation.csv` (2,200 rows, 22 crops) | **99.55% test accuracy** on N, P, K, temperature, humidity, pH, rainfall |
| **Soil & Fertilizer Analysis** | `RandomForestClassifier` + `OneHotEncoder` (`fertilizer_recommender.joblib`) | `fertilizer_prediction.csv` (99 rows, 7 fertilizers) + `crop_npk_reference.csv` | **95.00% test accuracy** + NPK/pH deficiency diagnostics |
| **Crop Disease Detection** | **MobileNetV2** (`linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`, 38 classes) + custom `model8.keras` support + **Gemini 2.5 Flash Vision** (`LOW_MEMORY_MODE`) | PlantVillage (54,305 images, 38 classes) | OpenCV quality check (`blur_score`, `brightness`) + non-diagnostic disclaimer |
| **Pest & Soil Vision** | **Gemini 2.5 Flash Vision** + OpenCV (`cv2`) | Uploaded / camera-captured images | Organic-first IPM advice & visual soil color/texture cues |
| **PDF & Knowledge RAG** | **FAISS** + `sentence-transformers/all-MiniLM-L6-v2` (local) / **Pinecone** (`smartagri-kb`, 384-dim) / **TF-IDF** (`LOW_MEMORY_MODE`) | Uploaded PDFs, DOCX, TXT, MD + `documents/` | Text extraction (`pypdf`, `docx2txt`), Hindi summaries, grounded Q&A, pure-Python `.pdf` report generator |
| **Voice Input & Output** | `SpeechRecognition` (Google STT) + `gTTS` (Text-to-Speech) | Browser 16-bit PCM WAV audio | Speak & listen in Hindi, Malayalam, English, and regional Indian languages |
| **Live Weather** | Open-Meteo Geocoding & Forecast API | Live real-time meteorological data | 5-day forecast + automated rain/heat/humidity/wind farming alerts |

## Core Modules

1. **AI Crop Disease Detection** — Upload or capture leaf photos (`MobileNetV2 PlantVillage` 38-class PyTorch classifier + optional custom `model8.keras`), OpenCV image quality checks, precautionary guidance, and non-diagnostic disclaimer.
2. **Soil Health & Fertilizer Assistant** — ML Fertilizer Recommendation (`RandomForestClassifier` trained on `fertilizer_prediction.csv`), NPK/pH deficiency analysis, Soil Photo Exploration, and downloadable PDF reports.
3. **Crop & Seed Recommendation** — `RandomForestClassifier` trained on 2,200 soil & climate rows (22 crops, 99.55% test accuracy) + ICAR/state seed variety advisor.
4. **Pest Identification** — Upload or camera-capture pest photos for Gemini Vision identification & organic-first prevention steps.
5. **Weather Assistant & Irrigation Planner** — Live weather via Open-Meteo API + farming alerts + dynamic crop-stage watering schedules.
6. **Mandi Price Information** — Regional APMC price table and comparison chart (clearly labeled reference/demo data when live Agmarknet API is unconfigured).
7. **Government Schemes & Crop Insurance** — PM-KISAN, PMFBY, KCC, Soil Health Card, PMKSY, PKVY, SMAM + PMFBY 72-hour claim checklist assistant.
8. **AI Agriculture & Voice Assistant** — Gemini-powered LangGraph chat with WAV voice recording (`SpeechRecognition`) and multi-language audio playback (`gTTS`).
9. **PDF & Knowledge Assistant** — Local `FAISS` + `PyPDF` RAG engine: upload PDFs/DOCX/TXT, semantic search, Hindi summaries, grounded Q&A, and downloadable PDF agriculture reports.
10. **Crop Calendar, Profit Calculator, Organic & Equipment Guides, Farmer Community, Notifications, Farmer Profile & Admin Dashboard**.

## Project Structure

```
SmartAgri-AI/
├── backend/
│   ├── app/
│   │   ├── config.py                # Paths, .env, upload limits & JWT settings
│   │   ├── database.py              # SQLite schema (users, profiles, calendars, posts, alerts)
│   │   ├── security.py              # JWT auth, bcrypt hashing, rate limiting, file validation
│   │   ├── llm.py                   # Gemini (google-genai) & Groq LLM wrapper
│   │   ├── main.py                  # FastAPI entrypoint & LangGraph chat/voice endpoints
│   │   ├── models/
│   │   │   ├── prediction.py        # Plant disease image classifier
│   │   │   └── ml_services.py       # Crop, Soil/Fertilizer, Seed & Vision services
│   │   ├── rag/
│   │   │   ├── local_faiss.py       # Local FAISS RAG, summarizer & PDF report generator
│   │   │   ├── document_processor.py
│   │   │   └── documents_manager.py
│   │   └── routers/                 # auth, ai_tools, agri_info, farm_ops, documents_voice
│   ├── datasets/                    # Kaggle-origin CSV datasets
│   ├── model/                       # Trained .joblib models & training_metrics.json
│   └── scripts/
│       └── train_models.py          # Train Crop & Fertilizer RandomForest models
├── frontend/                        # React + Vite + Tailwind CSS (Dark/Light + Easy/Expert)
├── streamlit_app/                   # Optional Streamlit UI
├── documents/                       # Agricultural PDFs / manuals
├── Dockerfile.backend
├── docker-compose.yml
├── .env.example
└── requirements.txt
```

## Setup & Running Locally

### 1. Environment Variables
Copy `.env.example` to `.env` in the project root and set:
- `GEMINI_API_KEY` (for AI chat, vision, PDF summaries)
- `JWT_SECRET` (for production authentication)
- `PINECONE_API_KEY` (optional — local FAISS works out-of-the-box without Pinecone)

### 2. Train ML Models (Already Pre-Trained in `backend/model/`)
```powershell
python backend/scripts/train_models.py
```

### 3. Start Backend (Terminal 1, from `D:\SmartAgri-AI`)
```powershell
pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Frontend (Terminal 2, from `D:\SmartAgri-AI\frontend`)
```powershell
npm install
npm run dev
```
Open **http://localhost:5173** (API Swagger Docs at **http://localhost:8000/docs**).

## Deployment (Render + Vercel & Docker)

### Backend on Render
- Blueprint: [render.yaml](render.yaml) | Dependencies: [requirements-render.txt](requirements-render.txt) | Python: `3.10.14` ([.python-version](.python-version), [runtime.txt](runtime.txt))
- **Root Directory:** *(leave blank)*
- **Build Command:** `pip install --no-cache-dir -r requirements-render.txt && python backend/scripts/train_models.py`
- **Start Command:** `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --workers 1`
- **Health Check:** `/health`
- **Env Vars:** `PYTHON_VERSION=3.10.14`, `LOW_MEMORY_MODE=1`, `USE_TF=0`, `USE_TORCH=1`, `GEMINI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME=smartagri-kb`, `JWT_SECRET`, `ALLOWED_ORIGINS=https://smart-agriculture-query-and-advisor.vercel.app`

### Frontend on Vercel
- **Root Directory:** `frontend` (includes [frontend/vercel.json](frontend/vercel.json))
- **Build Command:** `npm run build` | **Output Directory:** `dist`
- **Env Var:** `VITE_API_URL=https://<your-render-backend>.onrender.com`

### Docker Deployment
```bash
docker compose up --build
```
