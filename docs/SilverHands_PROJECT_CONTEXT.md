# SilverHands Project Context & Source of Truth

**Tagline:** "Turning Lifelong Skills Into New Opportunities."  
**Current Version:** v4.3.0 (Mobile App Voice Assistance & Audio Playback + Expo SDK 54 Native Integration)  
**Status:** Complete, India-Ready & Fully Verified Across Web & Mobile

---

## 1. Project Overview & Multi-Client Architecture
SilverHands is an AI-powered livelihood platform connecting skilled Indian senior citizens and homemakers with local neighborhood demand for home cooking/tiffin, school tutoring, saree blouse tailoring, terrace kitchen gardening, and life mentoring.

```
Hexaware-Hackathon-2026/
├── backend/     ← FastAPI, SQLAlchemy, SQLite/PostgreSQL, Real Google GenAI SDK (Port 8000)
├── frontend/    ← React 19, TypeScript, Vite Web Client with Web Speech STT/TTS (Port 5173)
├── mobile/      ← React Native 0.81.5, Expo SDK 54, expo-speech TTS & VoiceInput Assistance (Port 8081 / Expo Go)
└── docs/        ← SilverHands_PROJECT_CONTEXT.md (v4.3.0 Source of Truth)
```

### 1.1 Mobile Voice Assistance (v4.3.0)
- **Text-to-Speech (TTS) Engine:**
  - Integrated `expo-speech` with multilingual voice playback in **Indian English (`en-IN`)**, **Tamil (`ta-IN`)**, and **Hindi (`hi-IN`)** at senior-friendly pacing (rate: `0.92`).
  - **SilverBot Voice Playback:** Listen button (`🔊 Listen` / `⏹️ Stop`) on all AI mentor answers in `AssistantScreen.tsx`.
  - **Bio & Advice Voice Playback:** Senior biography and AI mentor advice audio playback in `SkillBuilderScreen.tsx`.
- **Speech-to-Text (STT) & Voice Input Assistance (`VoiceInputButton`):**
  - Web & Browser Speech Recognition for live microphone dictation.
  - Senior-friendly Voice Assistance Sheet with common prompt presets in English, Tamil, and Hindi for zero-typing accessibility.
  - Deployed on **Skill Builder description**, **SeniorBot chat input**, **Business Guidance concept & location**, and **Marketplace service search**.

---

## 2. Shared Core AI Agents (Real Google GenAI Execution)
1. **Skill & Profile AI Agent (`/api/v1/ai/extract-skills`):**
   - Parses plain natural language or voice spoken by senior citizens to extract structured skills, fair ₹ INR pricing, and authentic biography copy.
2. **AI Profile Builder Agent (`/api/v1/ai/profile-builder`):**
   - Generates warm headline and structured bio with `"AI-assisted — please verify before publishing"` verification notice.
3. **Deterministic 5-Factor Smart Matching Engine & AI Explainer (`/api/v1/ai/smart-match`):**
   - Deterministic 5-factor scoring engine (Skill 40%, Distance 25%, Rating 15%, Experience 10%, Reliability 10%) with animated percentage progress bars.
   - Generates transparent match reason tags (e.g. `✓ Nearby (0.8 km away)`, `✓ 15+ Years Experience`, `✓ Top Rated (5.0★)`, `✓ 8 Services Completed`, `✓ Identity Verified`).
   - Gemini AI produces a concise 2-sentence rationale explaining the recommendation.
4. **Senior Assistant / Business Mentor Agent (`/api/v1/ai/assistant`):**
   - 'SilverBot' answers questions about micro-business startup (tiffin, pickles, tailoring), pricing in ₹ INR, customer safety guidelines, and audio playback in English, Tamil, and Hindi.
5. **Micro-Business Guidance Agent (`/api/v1/ai/business-guidance`):**
   - Actionable 5-part plan for informal home services in India (concept, customers, pricing in ₹ INR, zero-cost marketing, first 3 steps, packaging & hygiene). Labeled `"AI-generated guidance — please verify before acting"`.

---

## 3. How to Run Backend + Web + Mobile Together

### 1. Start FastAPI Backend:
```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```
- API Health: `http://localhost:8000/api/v1/health`
- Swagger Docs: `http://localhost:8000/docs`

### 2. Start Web Frontend:
```bash
cd frontend
npm run dev -- --port 5173
```
- Web Application: `http://localhost:5173`

### 3. Start Mobile App (Expo SDK 54):
```bash
cd mobile
npx expo start -c
# or run in web / android emulator:
npm run web
npm run android
```

---

## 4. Verification & Change Log
- **v4.3.0 (2026-08-15):** Voice Assistance (expo-speech TTS + VoiceInput STT) across Skill Builder, Mentor Bot, Business Guidance & Marketplace Search.
- **v4.2.0 (2026-08-15):** Status Bar Overlap Fix + Navigation / Back Button Polish + SafeArea Insets.
- **v4.1.0 (2026-08-15):** Expo SDK 54 Dependency Fix + Navigation UX & Mobile LAN IP Connectivity.
- **v4.0.0 (2026-08-15):** Mobile App (React Native + Expo + TypeScript) Initial Release.
- **v3.2.0 (2026-08-15):** Hexaware-Inspired Enterprise Visual Design + Opportunities View.
- **v3.1.0 (2026-08-15):** Bug Fixes + Balanced UI + Multilingual + Real Gemini + Express Interest.
- **v3.0.0 (2026-08-15):** Full Lifecycle + Opportunity Engine + Navy Corporate UI.
- **v1.1.0 (2026-08-14):** Major Functionality & Gemini Integration Update.
- **v1.0.0 (2026-08-14):** Initial SilverHands platform release.
