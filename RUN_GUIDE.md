# SilverHands v6.0 — Complete Execution & Run Guide

Welcome to **SilverHands (சில்வர் ஹேண்ட்ஸ் / सिल्वरहैंड्स)** — India's Premier AI-Powered Silver Economy Platform connecting Senior Citizens & Homemakers with Hyperlocal Opportunities.

---

## 🏗️ Architecture & Component Overview

| Layer | Technology | Default Port / URL | Description |
| :--- | :--- | :--- | :--- |
| **Backend API** | FastAPI, Python 3.12, SQLAlchemy, Supabase / PostgreSQL | `http://localhost:8000` | Core REST APIs, deterministic Opportunity Scoring Engine, Media Uploads, Gemini Generative AI integration |
| **Interactive Docs** | Swagger / OpenAPI | `http://localhost:8000/docs` | Live API testing interface with all v6.0 endpoints |
| **Web Frontend** | React 19, TypeScript, Vite, TailwindCSS / Vanilla CSS | `http://localhost:5173` | Senior-friendly web app with Skill Passport, Local Demand Radar, AI Mentors, and High Contrast mode |
| **Mobile App** | React Native 0.81, Expo SDK 54, TypeScript | `http://localhost:8081` (Expo) | Cross-platform mobile app with multilingual voice TTS and tap-to-dial |

---

## 🚀 Quick Start (Step-by-Step)

### 1. Start the Backend API Server

Open a terminal in the `backend/` directory:

```bash
cd backend

# 1. Activate Python virtual environment
.\venv\Scripts\Activate.ps1   # (or .\venv\Scripts\activate on CMD)

# 2. Verify dependencies
pip install -r requirements.txt

# 3. Run data migration (if connecting fresh database)
python migrate_sqlite_to_postgres.py

# 4. Start FastAPI server with live reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **API Server URL:** [http://localhost:8000](http://localhost:8000)  
> **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)  
> **Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 2. Start the Web Frontend Application

Open a second terminal in the `frontend/` directory:

```bash
cd frontend

# 1. Install dependencies (if not already installed)
npm install

# 2. Build validation
npm run build

# 3. Launch Vite development server
npm run dev
```

> **Web Application URL:** [http://localhost:5173](http://localhost:5173)

---

### 3. Start the Mobile Application (Expo)

Open a third terminal in the `mobile/` directory:

```bash
cd mobile

# 1. Check TypeScript types
npm run check-types

# 2. Start Expo Metro bundler
npm start
# (or 'npm run web' to preview in browser directly)
```

---

## 🌟 Core v6.0 Endpoints & Capabilities

### 1. Deterministic Opportunity Engine & Local Demand Radar
- **Feed Endpoint:** `GET /api/v1/opportunities/feed?provider_id=1`
  - *Formula:* Skill Match (40%) + Location Distance (20%) + Local Demand (15%) + Availability (10%) + Experience (10%) + Trust Badge (5%).
  - *Checklist Reasons:* Transparent, human-verifiable reasons attached to every score.
- **Demand Radar:** `GET /api/v1/opportunities/demand-radar?location=Mumbai`
  - Returns neighborhood demand levels (High / Medium), active request volume, average hourly rate in ₹ INR, top requested skills, and growth trends.
- **Express Interest:** `POST /api/v1/opportunities/{opp_id}/interest?provider_id=1`
  - Full lifecycle with duplicate prevention (returns 400 Bad Request on duplicate attempts).
- **Opportunity Owner View:** `GET /api/v1/opportunities/{opp_id}/interests`
  - Shows all interested providers with ratings, trust badges, and skills.
- **Accept Provider:** `POST /api/v1/opportunities/{opp_id}/interests/{interest_id}/accept`
  - Transitions interest to confirmed booking.

### 2. Senior Skill Passport
- **Passport Endpoint:** `GET /api/v1/providers/{provider_id}/skill-passport`
  - Clear distinction between **Platform Verified Facts** (completed service count, verified 5.0★ rating, verified reviews count) and **Claimed Experience**.
  - Includes registered skill areas, hourly rates in ₹ INR, and senior bio summary.

### 3. Profile Readiness ("Improve My Opportunities")
- **Readiness Endpoint:** `GET /api/v1/providers/{provider_id}/readiness`
  - Computes concrete readiness percentage with actionable checklist (Photo, Skills, Location, Availability, Work Samples, Video Intro, Trust Badge).

### 4. Media Upload (Photo + Video + Work Samples)
- **Upload Avatar:** `POST /api/v1/providers/upload-avatar?user_id=1` (JPEG/PNG/WEBP <=5MB, returns cache-busted URL `?t=...`).
- **Remove Avatar:** `DELETE /api/v1/providers/{provider_id}/avatar`.
- **Upload Video:** `POST /api/v1/providers/upload-video?user_id=1` (MP4/WebM <=50MB).
- **Remove Video:** `DELETE /api/v1/providers/{provider_id}/video`.
- **Work Samples CRUD:** `POST /api/v1/providers/{provider_id}/work-samples`, `GET /api/v1/providers/{provider_id}/work-samples`, `DELETE /api/v1/providers/{provider_id}/work-samples/{id}`.

### 5. Gemini GenAI Integration (Scoped & Guardrailed)
- **AI Model:** Powered by active Google GenAI models (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`).
- **Skill Extraction:** `POST /api/v1/ai/extract-skills`
- **Smart Match Rationale:** `POST /api/v1/ai/smart-match`
- **Senior AI Mentor:** `POST /api/v1/ai/assistant`
- **Business Guidance:** `POST /api/v1/ai/business-guidance`

---

## 🧪 Automated Testing

Run the automated verification test suite:

```bash
cd backend
.\venv\Scripts\python test_app_endpoints.py
```

All 9 end-to-end test scenarios (Health, Providers, Skill Passport, Readiness, Demand Radar, Opportunity Feed, Express Interest with duplicate check, Work Samples CRUD, AI Smart Match) will execute and assert 100% success.
