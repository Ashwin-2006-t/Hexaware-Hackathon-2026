# SilverHands Project Context & Source of Truth

**Tagline:** "Turning Lifelong Skills Into New Opportunities."  
**Current Version:** v6.0.0 (Opportunity Engine + Skill Passport + Media Upload + Supabase Completion)  
**Status:** Complete, India-Ready & Fully Verified Across Backend, Web & Mobile

---

## 1. Project Overview & Multi-Client Architecture
SilverHands is an AI-powered livelihood platform connecting skilled Indian senior citizens and homemakers with local neighborhood demand for home cooking/tiffin, school tutoring, saree blouse tailoring, terrace kitchen gardening, and life mentoring.

```
Hexaware-Hackathon-2026/
├── backend/     ← FastAPI, SQLAlchemy, Supabase / PostgreSQL & SQLite, Active Gemini Models (Port 8000)
├── frontend/    ← React 19, TypeScript, Vite Web Client with Skill Passport & Opportunity Engine (Port 5173)
├── mobile/      ← React Native 0.81.5, Expo SDK 54, expo-speech TTS & Voice Assistance (Port 8081 / Expo Go)
├── docs/        ← SilverHands_PROJECT_CONTEXT.md (v6.0 Source of Truth)
└── RUN_GUIDE.md ← Comprehensive multi-tier run instructions
```

---

## 2. Core v6.0 Capabilities

### 2.1 Deterministic Opportunity Engine & Local Demand Radar
- **Deterministic 6-Factor Scoring Formula:**
  $$\text{Score} = \text{Skill (40\%)} + \text{Location Distance (20\%)} + \text{Local Demand (15\%)} + \text{Availability (10\%)} + \text{Experience (10\%)} + \text{Trust (5\%)}$$
- **Checklist Reasons:** Every match displays transparent, human-verifiable reasons (`✓ Strong Crafts Match`, `✓ In Service Area`, `✓ High Neighborhood Demand`, `✓ 40+ Years Experience`, `✓ Platform Verified`).
- **Gemini Guardrail:** Gemini provides plain-language explainers grounded strictly in backend facts; it never invents or calculates scores.
- **Local Demand Radar:** Endpoint (`/api/v1/opportunities/demand-radar`) and UI displaying neighborhood demand levels (High / Medium), active request volume, average ₹ INR pricing, top requested skills, and growth trends across Indian cities.
- **Express Interest Full Lifecycle:** Provider expresses interest → Duplicate submissions are blocked (HTTP 400) → Button transitions to disabled "✓ Interest Sent" → Opportunity owner views interested providers (`/api/v1/opportunities/{opp_id}/interests`) → Opportunity owner accepts provider (`/api/v1/opportunities/{opp_id}/interests/{interest_id}/accept`) → Confirmed Booking is created.

### 2.2 Senior Skill Passport
- **Platform Verified Facts vs Claimed Experience:**
  - Distinctly surfaces verified completed service count, verified customer rating (5.0★), verified reviews count, work sample count, and intro video presence alongside self-claimed experience years.
  - Endpoints: `GET /api/v1/providers/{provider_id}/skill-passport`.

### 2.3 Opportunity Improvement Engine ("Improve My Opportunities")
- Dynamic profile readiness percentage calculation based on concrete milestones (Avatar Photo, Skills & Pricing, Neighborhood Location, Availability Hours, Work Samples Showcase, Intro Video Clip, Identity & Trust Badge).
- Actionable buttons dynamically recalculate readiness score upon completion.
- Endpoint: `GET /api/v1/providers/{provider_id}/readiness`.

### 2.4 Media Upload System (Photo + Video + Work Samples)
- **Profile Photo / Avatar:** Click-to-upload, validated formats (JPEG, PNG, WEBP <=5MB), stored in `/uploads/avatars/`, cache-busted with `?t=...`, and removable.
- **Video Intro / Work Demo Clips:** File validation (MP4, WebM, MOV <=50MB), stored in `/uploads/videos/`, embedded player with controls, and removable.
- **Work Samples Showcase:** Photo showcase gallery with image, title, category, description, and delete button.

### 2.5 Active Google GenAI SDK Models
- Configured for 2026 active model catalog (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`).

---

## 3. How to Run Backend + Web + Mobile

Please refer to [`RUN_GUIDE.md`](file:///d:/ASHWIN/Ashwin%20Programing/Hexaware%20Hackathon%282026%29/Hexaware-Hackathon-2026/RUN_GUIDE.md) for full step-by-step startup instructions.

### 1. Start FastAPI Backend:
```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Health: `http://localhost:8000/api/v1/health`
- Swagger Docs: `http://localhost:8000/docs`

### 2. Start Web Frontend:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. Start Mobile App:
```bash
cd mobile
npm start
```
