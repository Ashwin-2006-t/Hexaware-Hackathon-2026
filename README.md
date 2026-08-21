SilverHands — AI Livelihood Platform

SilverHands is an AI-powered platform that connects senior citizens and homemakers with people looking for trusted local services. It supports AI-assisted skill discovery, service matching, location-based search, bookings, notifications, virtual classes, calls, reviews, multilingual UI, and opportunity recommendations.

1. Main Features

AI Skill & Profile Interview

Voice-based AI interview during registration.

AI asks questions and collects the user's spoken answers.

Generates skills and profile information from the interview.

Users can repeat the interview when updating or creating a new profile.

Service Discovery & Smart Matching

Search for services using real database records.

Exact, partial, and case-insensitive service search.

Matching based on skills, service category, availability, and location.

Radius-based local provider search using geographic distance.

Explainable matching/recommendation results.

Location

User can enter/select their current location.

Latitude and longitude are stored for matching.

Configurable search radius.

Providers outside the selected radius are filtered out.

Opportunity Recommendations

Recommendations are generated from actual service/request data.

Dynamic opportunity and earning suggestions.

No hardcoded fake opportunities.

Booking & Requests

Customers can create service requests.

Seniors can receive and respond to requests.

Booking workflow supports acceptance, completion, and review flow.

Backend authorization prevents invalid workflow actions.

Reviews

Reviews are allowed only after a completed service.

Duplicate reviews for the same booking are prevented.

Notifications & WhatsApp

In-app notifications.

Notification clear functionality.

WhatsApp Cloud API integration.

WhatsApp message delivery status tracking.

Webhook support for WhatsApp status updates.

See WHATSAPP_SETUP.md for Meta WhatsApp configuration.

Virtual Live Class

Seniors can choose how they provide a service:

In Person

Online / Virtual

Both

Online-enabled bookings can use the virtual room.

WebRTC audio/video classroom.

Microphone and camera controls.

Live text chat.

Unauthorized users cannot join a room.

Calling

Authorized users can initiate calls for eligible service interactions.

Call actions are logged.

Phone numbers are protected/masked where applicable.

Multilingual Interface

Language selection is available in the application.

Translations are managed through the frontend i18n system.

2. Project Structure

Hexaware-Hackathon-2026/
│
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── interview_agent.py
│   │   │   ├── matching_agent.py
│   │   │   └── profile_update_agent.py
│   │   ├── models/
│   │   ├── routers/
│   │   │   ├── ai_interview.py
│   │   │   ├── calls.py
│   │   │   ├── matches.py
│   │   │   ├── notifications.py
│   │   │   ├── opportunities.py
│   │   │   ├── providers.py
│   │   │   ├── requests.py
│   │   │   ├── reviews.py
│   │   │   └── virtual_rooms.py
│   │   └── services/
│   │       ├── matching_service.py
│   │       ├── notification_service.py
│   │       └── whatsapp_service.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── AI_INTERVIEW_IMPLEMENTATION.md
├── WHATSAPP_SETUP.md
└── README.md

3. Requirements

Install the following before running the project:

Python 3.10+ recommended

Node.js 18+ recommended

npm

Git

A modern browser such as Chrome or Edge

For WhatsApp notifications, you additionally need a Meta Developer account and WhatsApp Cloud API credentials.

4. Clone the Project

git clone https://github.com/Ashwin-2006-t/Hexaware-Hackathon-2026.git
cd Hexaware-Hackathon-2026
git checkout krish

5. Backend Setup

Open PowerShell in the project root.

Create a Python virtual environment:

cd backend
python -m venv .venv

Activate it:

.\.venv\Scripts\Activate.ps1

If PowerShell blocks activation, run:

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Then activate again:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

6. Environment Variables

Create the backend environment file:

Copy-Item .env.example .env

Open:

backend/.env

Add the required application/AI credentials used by the project.

For WhatsApp Cloud API, configure the Meta values described in:

WHATSAPP_SETUP.md

Do NOT commit .env.

The repository intentionally contains .env.example rather than real secrets.

7. Start the Backend

From the backend directory:

.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

The backend will normally be available at:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

8. Start the Frontend

Open another PowerShell terminal.

From the project root:

cd frontend
npm install
npm run dev

Open the URL shown by Vite, normally:

http://localhost:5173

Keep both backend and frontend running.

9. Recommended Demo Flow

Customer Flow

Register/login as Customer.

Enter/select current location.

Open Find a Service.

Search for a service.

Set the desired search radius.

Review AI/data-driven provider matches.

Open a provider profile.

Send a service request.

Receive notifications.

After acceptance, use the appropriate delivery method.

For online services, join the Virtual Live Room.

Use the call option when available.

Complete the service.

Submit a review.

Senior Flow

Register/login as Senior.

Complete the AI skill interview.

Answer the questions using voice.

Review the generated skills/profile.

Choose service delivery preference:

In Person

Online / Virtual

Both

Add services.

Publish the profile.

Receive customer requests.

Accept suitable requests.

Provide the service.

Use the Virtual Live Room for online-enabled bookings.

Complete the request.

Receive reviews.

Check opportunity recommendations.

10. Virtual Room Requirement

A senior can specify whether their service supports an online/virtual delivery method.

If the service is configured as:

IN_PERSON

a Virtual Live Room cannot be created for that booking.

If it is:

ONLINE

or:

BOTH

the booking can use the Virtual Live Room, subject to authorization.

11. WhatsApp Setup

WhatsApp is an external Meta service and will not send real messages until valid Meta credentials are configured.

Follow:

WHATSAPP_SETUP.md

The application supports:

WhatsApp Cloud API message sending.

Message ID storage.

Sent/delivered/read/failed status tracking.

Meta webhook verification.

Webhook status updates.

Without credentials, the application reports the appropriate not-configured state instead of pretending a message was sent.

12. Testing

Backend integration tests are included in backend/.

Examples:

cd backend
.\.venv\Scripts\python.exe -u test_ai_interview_suite.py
.\.venv\Scripts\python.exe -u test_real_location_system.py
.\.venv\Scripts\python.exe -u test_service_discovery_bug.py
.\.venv\Scripts\python.exe -u test_service_delivery_mode.py
.\.venv\Scripts\python.exe -u test_notifications_and_whatsapp.py
.\.venv\Scripts\python.exe -u test_real_features_integration.py

Run the complete backend test set with:

Get-ChildItem test_*.py | ForEach-Object {
    & .\.venv\Scripts\python.exe -u $_.FullName
}

13. Frontend Build Verification

From frontend:

npm run build

To run the production preview:

npm run preview

14. Database

The project uses SQLite for local development.

The database file is:

backend/silverhands.db

The application creates/updates the required database structures when the backend starts.

For a clean local development environment, use a fresh database if required by the current application setup.

Do not depend on manually inserted demo records for core functionality. Services, profiles, requests, matching, and recommendations should be generated from actual application data.

15. Important Security Notes

Never commit:

.env
API keys
Meta access tokens
private credentials
production secrets

Only commit safe example configuration such as:

.env.example

16. Demo Videos

The repository contains the project demonstration videos tracked using Git LFS.

Install Git LFS if needed:

git lfs install

Then clone/pull the repository normally. Git LFS will download the video files.

Check LFS files with:

git lfs ls-files

17. Troubleshooting

Backend does not start

Check that the virtual environment is active:

.\.venv\Scripts\Activate.ps1

Then reinstall dependencies:

pip install -r requirements.txt

Frontend does not start

From frontend:

npm install
npm run dev

Service does not appear in search

Check:

The senior profile is published.

The service was saved successfully.

The service has the correct category/name.

The customer's search radius includes the provider.

The provider has valid location coordinates.

Virtual Room unavailable

Check the booking's delivery mode. In-person-only bookings cannot use the Virtual Live Room.

WhatsApp does not send

Check:

Meta credentials are configured in backend/.env.

The phone number is correctly configured.

The WhatsApp Cloud API setup is complete.

Webhook configuration is correct.

See WHATSAPP_SETUP.md.

18. API Documentation

Once the backend is running, open:

http://127.0.0.1:8000/docs

This provides the interactive FastAPI API documentation.

19. Project Verification

Before presenting or deploying the project, verify:

# Backend
cd backend
.\.venv\Scripts\python.exe -u test_real_features_integration.py

# Frontend
cd ..\frontend
npm run build

Then manually verify the major end-to-end flows:

AI Interview
    ↓
Skill/Profile Generation
    ↓
Service Creation
    ↓
Location Selection
    ↓
Service Search + Radius Matching
    ↓
Request
    ↓
Acceptance
    ↓
In-Person / Online Delivery
    ↓
Virtual Room / Call
    ↓
Completion
    ↓
Review
    ↓
Opportunity Recommendations
    ↓
Notifications / WhatsApp

20. Branch

The current implementation is available on:

krish

Remote repository:

https://github.com/Ashwin-2006-t/Hexaware-Hackathon-2026.git

Quick Start

For an already configured machine:

git clone https://github.com/Ashwin-2006-t/Hexaware-Hackathon-2026.git
cd Hexaware-Hackathon-2026
git checkout krish

cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

Open a second terminal:

cd Hexaware-Hackathon-2026\frontend
npm install
npm run dev

Then open the Vite URL shown in the terminal.
