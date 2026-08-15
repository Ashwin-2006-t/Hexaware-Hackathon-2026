# SilverHands Project Context & Source of Truth

**Tagline:** "Turning Lifelong Skills Into New Opportunities."  
**Current Version:** v3.1.0 (Bug Fixes + Balanced UI + Multilingual EN/TA/HI + Real Gemini + Express Interest)  
**Status:** Complete, India-Ready & Fully Verified

---

## 1. Project Overview
SilverHands is an AI-powered, senior-friendly livelihood platform connecting skilled Indian senior citizens and homemakers with local neighbors seeking trusted home cooking/tiffin, school tutoring, saree blouse tailoring, terrace kitchen gardening, and life mentoring.

### Core Architecture
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet Maps (Vite v8.2)
- **Design System:** Balanced Enterprise SaaS + Indian Social Impact palette:
  - White and light slate background (`#F8FAFC`, `#FFFFFF`), clean cards with subtle borders (`#E2E8F0`), dark slate typography (`#0F172A`, `#334155`).
  - Deep Navy header branding (`#0F2744`), Royal Blue primary actions (`#2563EB` / `#1D4ED8`) used selectively.
  - High Contrast Mode (pure `#000000` black, amber `#FACC15`, stark white `#FFFFFF`).
  - 3-tier font size scaling (A: 16px, A+: 19px, A++: 22px) persisted in `localStorage`.
- **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn, SQLite (`silverhands.db`) / PostgreSQL
- **AI Integration:** Real Google GenAI SDK (`google-genai`) with Gemini models (`gemini-flash-latest`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`) supporting:
  1. Natural Language & Voice Skill Extraction (`/api/v1/ai/extract-skills`)
  2. Grounded Profile Bio Builder (`/api/v1/ai/profile-builder`)
  3. 5-Part Micro-Business Guidance Plan (`/api/v1/ai/business-guidance`)
  4. Conversational Senior Mentor Bot (`/api/v1/ai/assistant`) in English, Tamil, and Hindi
  5. Deterministic 5-Factor Match Rationale Explainer (`/api/v1/ai/smart-match`)
- **Multilingual Support:** English, Tamil (தமிழ்), and Hindi (हिन्दी) covering all navigation, marketplace, booking, AI chat, and forms.
- **Voice Assistant:** Web Speech STT (Speech-to-Text) in `en-IN`, `ta-IN`, `hi-IN` $\to$ real backend Gemini response in same language $\to$ Web Speech Synthesis TTS (Text-to-Speech) audio playback.
- **Opportunity Engine & Express Interest:**
  - `GET /api/v1/providers/{id}/opportunities`: Personalized local customer demand feed with match score and checklist reasons.
  - `POST /api/v1/providers/{id}/opportunities/{id}/interest`: Express interest persistence with duplicate rejection (400) and instant UI state flip to "Interest Sent ✓".
- **Localization:** 100% India-ready with ₹ INR currency formatting, Indian number grouping, Indian phone numbers, and bundled local senior portrait assets (`/avatars/seed/*.jpg`).

---

## 2. Core AI Agents (Verified Dynamic Gemini Execution)
1. **Skill & Profile AI Agent (`/api/v1/ai/extract-skills`):**
   - Parses plain natural language or voice spoken by senior citizens to extract structured skills, fair ₹ INR pricing, and authentic biography copy.
   - Diagnosed and fixed 404 issue by configuring `GEMINI_MODEL="gemini-flash-latest"` with multi-candidate automatic fallback across active versions.
2. **AI Profile Builder Agent (`/api/v1/ai/profile-builder`):**
   - Generates warm headline and structured bio with `"AI-assisted — please verify before publishing"` verification notice.
3. **Deterministic 5-Factor Smart Matching Engine & AI Explainer (`/api/v1/ai/smart-match`):**
   - Deterministic 5-factor scoring engine (Skill 40%, Distance 25%, Rating 15%, Experience 10%, Reliability 10%).
   - Generates transparent match reason tags (e.g. `✓ Nearby (0.8 km away)`, `✓ 15+ Years Experience`, `✓ Top Rated (5.0★)`, `✓ 8 Services Completed`, `✓ Identity Verified`).
   - Gemini AI produces a concise 2-sentence rationale explaining the recommendation.
4. **Senior Assistant / Business Mentor Agent (`/api/v1/ai/assistant`):**
   - 'SilverBot' answers questions about micro-business startup (tiffin, pickles, tailoring), pricing in ₹ INR, customer safety guidelines, and audio playback in English, Tamil, and Hindi.
5. **Micro-Business Guidance Agent (`/api/v1/ai/business-guidance`):**
   - Actionable 5-part plan for informal home services in India (concept, customers, pricing in ₹ INR, zero-cost marketing, first 3 steps, packaging & hygiene).

---

## 3. Verified End-to-End Spine Lifecycle
The complete platform lifecycle has been exercised and verified:
$$\text{Signup} \to \text{Profile} \to \text{AI Skill ID} \to \text{AI Profile Builder} \to \text{Publish Service} \to \text{Marketplace} \to \text{Smart Match} \to \text{Booking} \to \text{Accept} \to \text{Complete} \to \text{Review} \to \text{Trust Score} \to \text{Opportunities Feed} \to \text{Express Interest}$$

---

## 4. Change Log
- **v3.1.0 (2026-08-15):** Bug Fixes + Balanced UI + Multilingual + Real Gemini + Express Interest:
  - **Gemini Root Cause Diagnosed & Fixed:** Replaced stale `gemini-1.5-flash` with active `gemini-flash-latest` and resilient multi-model fallback. Verified live dynamic responses across all 5 AI endpoints with zero fallbacks.
  - **Balanced Enterprise UI:** Soft white/slate background (`#F8FAFC`), crisp white cards with subtle borders (`#E2E8F0`), dark slate typography (`#0F172A`), deep navy branding header (`#0F2744`), and royal blue primary buttons.
  - **Express Interest:** Backend model `OpportunityInterest`, database persistence, duplicate application rejection (400), and frontend button flip to "Interest Sent ✓" (disabled).
  - **Multilingual Support (EN / TA / HI):** Centralized `i18n/translations.ts` dictionary and UI selector for English, Tamil, and Hindi.
  - **Voice Assistant (STT + TTS):** Web Speech speech-to-text in `en-IN`, `ta-IN`, `hi-IN` $\to$ backend Gemini response $\to$ text-to-speech audio playback in same language.
  - **Bundled Senior Demo Portraits:** 7 local static portrait assets in `/avatars/seed/` (`lakshmi_amma.jpg`, `meenakshi_amma.jpg`, `ravi_uncle.jpg`, `saraswati_amma.jpg`, `kalyan_sir.jpg`, `raman_uncle.jpg`, `ananya_homemaker.jpg`).
  - **14/14 Automated API Tests Passed:** Full test suite verified with zero errors. Clean production bundle build via `npm run build`.
- **v3.0.0 (2026-08-15):** Full Lifecycle + Opportunity Engine + Navy Corporate UI.
- **v1.1.0 (2026-08-14):** Major Functionality & Gemini Integration Update.
- **v1.0.0 (2026-08-14):** Initial SilverHands platform release.
