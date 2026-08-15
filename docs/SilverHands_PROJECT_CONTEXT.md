# SilverHands Project Context & Source of Truth

**Tagline:** "Turning Lifelong Skills Into New Opportunities."  
**Current Version:** v3.2.0 (Hexaware-Inspired Enterprise UI + Dedicated Opportunities View + 5 Animated Factor Bars + Landing Hero & AI Showcase + Full Multilingual EN/TA/HI)  
**Status:** Complete, India-Ready & Fully Verified

---

## 1. Project Overview
SilverHands is an AI-powered, senior-friendly livelihood platform connecting skilled Indian senior citizens and homemakers with local neighbors seeking trusted home cooking/tiffin, school tutoring, saree blouse tailoring, terrace kitchen gardening, and life mentoring.

### Core Architecture
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet Maps (Vite v8.2)
- **Design System:** Hexaware-Inspired Enterprise SaaS Visual Language:
  - Deep Navy branding header & hero (`#0A0F24` / `#0D1127` / `#131838`)
  - Indigo/Purple primary CTAs (`#4B32E6` / `#3629D3`)
  - Cyan highlights and active progress bars (`#4099FF` / `#48A9FE`)
  - Light neutral canvas (`#F7F9FC`, `#FFFFFF`, `#F3F6FA`, `#EEF3F8`)
  - Clean white cards with subtle `#E2E8F0` borders and gentle hover lift (`transform: translateY(-2px)`)
  - Dark slate typography (`#111827`, `#374151`, `#64748B`)
  - High Contrast mode preserving brand hierarchy with `#000000` black and `#FACC15` amber gold
  - 3-tier font size scaling (A: 16px, A+: 19px, A++: 22px) persisted in `localStorage`
- **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn, SQLite (`silverhands.db`) / PostgreSQL
- **AI Integration:** Real Google GenAI SDK (`google-genai`) with Gemini models (`gemini-flash-latest`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`) supporting:
  1. Natural Language & Voice Skill Extraction (`/api/v1/ai/extract-skills`)
  2. Grounded Profile Bio Builder with verification notice (`/api/v1/ai/profile-builder`)
  3. 5-Part Micro-Business Guidance Plan (`/api/v1/ai/business-guidance`)
  4. Conversational Senior Mentor Bot (`/api/v1/ai/assistant`) in English, Tamil, and Hindi
  5. Deterministic 5-Factor Match Rationale Explainer (`/api/v1/ai/smart-match`)
- **Multilingual Support:** English, Tamil (தமிழ்), and Hindi (हिन्दी) across all navigation, hero, marketplace, booking, AI chat, business guidance, and forms.
- **Voice Assistant:** Web Speech STT in `en-IN`, `ta-IN`, `hi-IN` $\to$ backend Gemini response in same language $\to$ Web Speech Synthesis TTS audio playback.
- **Opportunity Engine & Express Interest:**
  - Dedicated `OpportunitiesView` tab + Dashboard opportunities feed.
  - `POST /api/v1/providers/{id}/opportunities/{id}/interest` with duplicate rejection (400) and instant UI state flip to "Interest Sent ✓".
- **Localization:** 100% India-ready with ₹ INR currency formatting, Indian number grouping, Indian phone numbers, and bundled local senior portrait assets (`/avatars/seed/*.jpg`).

---

## 2. Core AI Agents (Verified Dynamic Gemini Execution)
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

## 3. Verified End-to-End Spine Lifecycle
The complete platform lifecycle has been exercised and verified:
$$\text{Signup} \to \text{Profile} \to \text{AI Skill ID} \to \text{AI Profile Builder} \to \text{Publish Service} \to \text{Marketplace} \to \text{Smart Match} \to \text{Booking} \to \text{Accept} \to \text{Complete} \to \text{Review} \to \text{Trust Score} \to \text{Opportunities Feed} \to \text{Express Interest}$$

---

## 4. Change Log
- **v3.2.0 (2026-08-15):** Hexaware-Inspired Enterprise Visual Design + Opportunities View:
  - **Color & Design System:** Alternating deep navy (`#0A0F24` / `#0D1127`) and light neutral canvas (`#F7F9FC`, `#FFFFFF`), indigo primary CTAs (`#4B32E6`), cyan accents (`#4099FF`), and clean card hover lift.
  - **Landing Hero & Flow:** Hero banner with real live DB numbers, 4-step "How It Works" lifecycle, and enterprise AI architecture 5-agent showcase.
  - **5-Factor Smart Matching Bars:** Visual animated percentage progress bars for Skill (40%), Distance (25%), Rating (15%), Experience (10%), and Reliability (10%).
  - **Dedicated Opportunities View:** Dedicated top nav tab for neighborhood demand with match %, distance, budget, and Express Interest $\to$ "Interest Sent ✓".
  - **Senior-Friendly Accessibility:** High Contrast mode retaining enterprise hierarchy, 3-tier font scaler (16px, 19px, 22px), reduced-motion support, and full 3-language translations (EN, TA, HI).
  - **All 14/14 Automated API Tests Passed:** Zero errors across backend test suite and clean production frontend bundle (`npm run build`).
- **v3.1.0 (2026-08-15):** Bug Fixes + Balanced UI + Multilingual + Real Gemini + Express Interest.
- **v3.0.0 (2026-08-15):** Full Lifecycle + Opportunity Engine + Navy Corporate UI.
- **v1.1.0 (2026-08-14):** Major Functionality & Gemini Integration Update.
- **v1.0.0 (2026-08-14):** Initial SilverHands platform release.
