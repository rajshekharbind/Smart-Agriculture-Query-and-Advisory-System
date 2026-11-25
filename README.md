# AgroSathi AI — Smart Agricultural Assistance Platform (एग्रोसाथी AI)

A full-stack, mobile-first AI agricultural assistance platform designed for Indian farmers — supporting **Easy Mode** (simple Hindi-first navigation, voice input, audio playback) and **Expert Mode** (ML analytics, soil reports, PDF exports), with **Dark & Light Themes**.

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

## Docker Deployment
```bash
docker compose up --build
```
