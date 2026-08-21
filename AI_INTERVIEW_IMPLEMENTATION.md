# AI Skill Interview Room — Implementation & Technical Documentation

## Executive Summary
The **AI Skill Interview Room** provides an interactive, voice-and-text enabled AI skill verification classroom for senior service providers in SilverHands. Seniors can select or specify a skill, answer 3–5 dynamic conversational questions, receive an AI-synthesized professional skills profile, and review/approve extracted skills before anything is permanently saved to their database profile.

---

## 1. System Architecture & Flow

```
Senior Provider 
   │
   ├─► Selects Domain & Skill (e.g. "Food & Catering" / "Traditional Cooking")
   │
   ├─► Enters AI Skill Interview Room (POST /api/v1/ai/interview/start)
   │     ├─► Generates initial opening question via Gemini / Fallback Engine
   │     └─► Creates persistent AIInterviewSession record in SQLite
   │
   ├─► Submits Answers via Voice (WebSpeech API) or Text (POST /{session_id}/answer)
   │     ├─► Live transcript displayed before submission
   │     ├─► Evaluates conversation history with Gemini
   │     └─► Dynamically determines & returns next relevant question
   │
   ├─► Concludes Session (POST /{session_id}/complete)
   │     ├─► Gemini synthesizes structured JSON profile (Skills, Summary, Capabilities, Confidence %, Services)
   │     └─► Creates In-App Notification: "Your AI Skill Profile is Ready"
   │
   └─► Human Review & Approval (POST /{session_id}/approve-profile)
         ├─► Senior reviews/edits detected skills & suggested market services
         ├─► Clicking "Save to My Profile" persists approved skills to DB without duplicates
         └─► Real-Time Opportunity Recommendation Engine immediately updates!
```

---

## 2. Database Models (`backend/app/models/domain.py`)

1. **`AIInterviewSession` (`ai_interview_sessions` table)**:
   - `id`: String (UUID PK)
   - `senior_id`: String (FK `users.id`, indexed)
   - `selected_domain`: String
   - `selected_skill`: String
   - `status`: String (`CREATED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
   - `started_at`, `completed_at`: DateTime
   - `overall_score`: Integer (Confidence score %)
   - `summary`: Text (Experience summary)
   - `created_at`, `updated_at`: DateTime

2. **`AIInterviewMessage` (`ai_interview_messages` table)**:
   - `id`: String (UUID PK)
   - `session_id`: String (FK `ai_interview_sessions.id`, indexed)
   - `role`: String (`AI` or `SENIOR`)
   - `message`: Text
   - `input_type`: String (`TEXT` or `VOICE`)
   - `question_number`: Integer
   - `created_at`: DateTime

3. **`AIInterviewResult` (`ai_interview_results` table)**:
   - `id`: String (UUID PK)
   - `session_id`: String (FK `ai_interview_sessions.id`, unique)
   - `detected_skills`: Text (JSON string)
   - `experience_summary`: Text
   - `capabilities`: Text (JSON string)
   - `confidence_score`: Integer
   - `suggested_services`: Text (JSON string)
   - `evidence`: Text
   - `recommendation_reason`: Text
   - `created_at`: DateTime

---

## 3. API Endpoints (`backend/app/routers/ai_interview.py`)

| Method | Endpoint Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ai/interview/start` | Authenticates senior, creates `AIInterviewSession`, returns session & initial question |
| `POST` | `/api/v1/ai/interview/{session_id}/answer` | Authenticates & authorizes senior, persists text/voice answer, evaluates history, returns next question |
| `POST` | `/api/v1/ai/interview/{session_id}/complete` | Generates structured result JSON, marks session `COMPLETED`, creates in-app notification |
| `GET` | `/api/v1/ai/interview/{session_id}` | Fetches session state, messages, and result |
| `GET` | `/api/v1/ai/interview/my-interviews` | Lists authenticated senior's interview history |
| `POST` | `/api/v1/ai/interview/{session_id}/approve-profile` | Persists senior-approved skills/services to `ProviderProfile` in SQLite |

---

## 4. Voice Input Implementation (`frontend/src/components/AIInterviewRoom.tsx`)

- **Browser WebSpeech API Integration**: Uses `window.SpeechRecognition` or `window.webkitSpeechRecognition`.
- **Flow**:
  1. Senior clicks microphone button (`Speak Answer`).
  2. Browser requests microphone access and displays live pulsing recording indicator.
  3. Transcribed speech appears live in text area (`voiceTranscript`).
  4. Senior reviews, edits, or clears text before clicking **"Submit Answer"**.
  5. Text answer is transmitted with `input_type = "VOICE"`.
- **Fallback**: If browser speech recognition is unsupported or permission is denied, system clearly prompts senior to use standard text entry.

---

## 5. Gemini AI Engine & Quota Protection (`backend/app/agents/interview_agent.py`)

- **Model**: `models/gemini-3.6-flash` (or `gemini-2.5-flash`) via `google-genai` SDK.
- **Structured JSON Prompting**: Uses `response_mime_type="application/json"` to ensure strict JSON output for skill extraction, capabilities, confidence score, and suggested market services.
- **Quota Resilience**:
  - Max 5 questions per interview session to control API usage.
  - All Gemini calls are wrapped in `try/except`.
  - If `GEMINI_API_KEY` is missing or if Gemini returns `429 RESOURCE_EXHAUSTED` / `503 UNAVAILABLE`, an intelligent rule-based fallback generator synthesizes realistic questions and structured profile results from the senior's previous responses without throwing server errors.

---

## 6. Human Approval & Opportunity Engine Integration

- **Human Approval**: Generated skills/services are NEVER written to the DB profile automatically. Senior reviews interactive checklist (`[✓ Add]`, `[✕ Remove]`, `[+ Add Custom]`) and clicks `"Save to My Profile"`.
- **Opportunity Engine Integration**: Approved skills and services are saved to `skills` and `services` tables in SQLite (preventing duplicate entries). The real-time Opportunity Recommendation Engine (`/api/providers/me/opportunities`) immediately recognizes newly approved skills and matches them with active local customer demand.

---

## 7. Verification & Automated Test Results

- **AI Interview Test Suite (`test_ai_interview_suite.py`)**: `5/5 PASSED (100%)`
- **Real Features Integration Suite (`test_real_features_integration.py`)**: `5/5 PASSED (100%)`
- **Frontend Production Build (`npm run build`)**: `✓ built in 1.19s — 0 TypeScript/Compilation Errors`
