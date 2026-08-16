# 🚀 SilverHands — Complete Run & Setup Guide (Web, Mobile & Backend)

Welcome to **SilverHands (சில்வர் ஹேண்ட்ஸ் / सिल्वरहैंड्स)** — India's Premier AI-Powered Silver Economy Platform connecting Senior Citizens & Homemakers with Hyperlocal Opportunities.

This comprehensive guide contains everything you need to run, test, and demonstrate the entire system (**Backend API**, **Web Application**, and **Mobile App**).

---

## 📌 System Architecture & Port Reference

```mermaid
graph TD
    A[Clients] --> B[Web Frontend - React 19 / Vite :5173]
    A --> C[Mobile App - Expo / React Native :8081]
    B --> D[FastAPI Backend Engine :8000]
    C --> D
    D --> E[PostgreSQL / Supabase / SQLite]
    D --> F[Google Gemini GenAI Models]
```

| Service                   | Technology                                        | Local URL                     | Description                                                               |
| :------------------------ | :------------------------------------------------ | :---------------------------- | :------------------------------------------------------------------------ |
| **Backend API**           | FastAPI, Python 3.12, SQLAlchemy, Supabase/SQLite | `http://localhost:8000`       | REST API, Deterministic Opportunity Engine, Skill Passport, Media Uploads |
| **API Documentation**     | Swagger / OpenAPI UI                              | `http://localhost:8000/docs`  | Interactive API explorer & testing sandbox                                |
| **API ReDoc**             | ReDoc                                             | `http://localhost:8000/redoc` | Clean API technical documentation                                         |
| **Web Frontend**          | React 19, TypeScript, Vite                        | `http://localhost:5173`       | Senior-friendly dashboard, Local Demand Radar, AI Mentors                 |
| **Mobile App (Metro)**    | React Native 0.81.5, Expo SDK 54                  | `http://localhost:8081`       | Cross-platform app with multilingual Voice TTS & Speech input             |
| **Mobile App (Web Mode)** | Expo Web Preview                                  | `http://localhost:8081`       | In-browser preview for mobile app screens                                 |

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** v18+ or v20+ (`node -v`)
- **Python** 3.11+ or 3.12+ (`python --version`)
- **PowerShell** or **Command Prompt (CMD)**

---

## ⚡ Step-by-Step Instructions to Run All 3 Services

### 1️⃣ Terminal 1 — Start the Backend Server (Port 8000)

Open your first terminal in the repository root:

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# (Optional) If running on Command Prompt (CMD):
# .\venv\Scripts\activate.bat

# Verify/Install required dependencies
pip install -r requirements.txt

# Start FastAPI server with live hot-reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> 🟢 **Backend Live at:** [http://localhost:8000](http://localhost:8000)  
> 🟢 **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)  
> 🟢 **Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 2️⃣ Terminal 2 — Start the Web Frontend (Port 5173)

Open your second terminal in the repository root:

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies (if first time)
npm install

# Start Vite Development Server
npm run dev
```

> 🟢 **Web Application Live at:** [http://localhost:5173](http://localhost:5173)

---

### 3️⃣ Terminal 3 — Start the Mobile App (Expo Metro Port 8081)

Open your third terminal in the repository root:

```powershell
# Navigate to mobile directory
cd mobile

# Install mobile dependencies (if first time)
npm install

# Option A: Start Expo Metro Bundler (For Android/iOS Simulator or Expo Go app)
npm start

# Option B: Run directly in Web Browser for fast mobile view testing
npm run web
```

> 🟢 **Mobile Metro Bundler:** `http://localhost:8081` (Scan QR code with **Expo Go** on Android/iOS)  
> 🟢 **Mobile Web Preview:** `http://localhost:8081`

---

## 🧪 Testing & Verification Scripts

To run all automated capability checks and verify every tier of the application, execute these commands:

### A. Backend End-to-End Test Suite (9 Scenarios)

```powershell
cd backend
.\venv\Scripts\python test_app_endpoints.py
```

_Validates: Health, 8 Senior Providers, Skill Passport, Opportunity Improvement Engine (Readiness %), Local Demand Radar, Deterministic Scoring Feed, Express Interest with Duplicate Prevention, Work Samples CRUD, and Gemini 3.5 Flash Smart Matching._

### B. Frontend Production Build Check

```powershell
cd frontend
npm run build
```

_Compiles TypeScript and bundles Vite production assets cleanly without errors._

### C. Mobile TypeScript Type Check

```powershell
cd mobile
npm run check-types
```

_Executes `tsc --noEmit` on React Native & Expo SDK 54 types._

---

## 🔑 Environment Variables & Configurations

### Backend Configuration (`backend/.env`)

```ini
PROJECT_NAME="SilverHands API"
API_V1_STR="/api/v1"
ENVIRONMENT="development"

# PostgreSQL / Supabase connection (falls back to local SQLite if offline)
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://psleqiosfnkzobwuqwxu.supabase.co"
SUPABASE_ANON_KEY="[ENCRYPTION_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[ENCRYPTION_KEY]"

# Google Gemini GenAI
GEMINI_API_KEY="[GCP_API_KEY]"
GEMINI_MODEL="gemini-3.5-flash"
```

---

## 🌟 Key Application Features to Try in Demo

1. **Deterministic Opportunity Engine (`/opportunities`)**:
   - Filter neighborhood requests by category (Cooking & Tiffin, Tutoring, Crafts, Gardening).
   - View match scores (e.g. `93.0%`) with transparent checklist reasons (`✓ Strong Crafts Match`, `✓ In Service Area`, `✓ 40+ Years Experience`, `✓ Platform Verified`).
   - Click **"Express Interest"** → Notice instant transition to disabled **"✓ Interest Sent"** state and duplicate protection.

2. **Local Demand Radar**:
   - Switch to the **"Local Demand Radar"** tab to view live demand levels, weekly growth trends, average ₹ INR hourly pricing, and top requested skills in Mumbai, Chennai, and Bengaluru.

3. **Senior Skill Passport (`/dashboard` → "Skill Passport")**:
   - View official digital credentials distinguishing **Platform Verified Facts** (completed jobs, 5.0★ rating, review count) from self-claimed lifelong experience.

4. **Improve My Opportunities (`/opportunities` → "Improve My Opportunities")**:
   - See your profile readiness percentage (e.g. `65%`) and interactive checklist items with direct actions.

5. **Media Upload & Video Playback**:
   - **Avatar:** Click the camera icon on your profile photo to upload a portrait image (validated <=5MB) with instant cache-busted preview and restore option.
   - **Intro Video:** Click **"Upload Intro Video"** to attach a 30-second senior video clip and watch it with the built-in video player.
   - **Work Samples:** Go to **"Work Samples"** tab to upload and showcase past cooking, stitching, or gardening photos.

6. **Voice Assistance & Accessibility**:
   - Toggle **High Contrast Mode** (Alt+H) for high-contrast visibility.
   - Switch language between **English**, **Tamil (தமிழ்)**, and **Hindi (हिंदी)**.
   - Use voice listening and dictation features.

---

## 🆘 Troubleshooting & Common Solutions

| Issue                                        | Cause                               | Solution                                                                                                                 |
| :------------------------------------------- | :---------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **FastAPI connection refused on port 8000**  | Backend server is not running       | Run `python -m uvicorn main:app --reload --port 8000` in `backend/`                                                      |
| **PowerShell script execution policy error** | `npm.ps1` or `activate.ps1` blocked | Run `cmd /c "npm run dev"` or use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`                           |
| **Supabase host DNS resolution error**       | Network lacks direct IPv6           | The backend automatically logs and safely uses `silverhands.db` so you can continue running locally without interruption |
| **Port 5173 or 8000 already in use**         | Stray process running               | Kill old process: `Stop-Process -Name node, python -Force` or specify another port                                       |
