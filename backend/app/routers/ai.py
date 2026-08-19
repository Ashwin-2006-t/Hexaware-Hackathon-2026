import os
from fastapi import APIRouter
from app.schemas.domain import (
    SkillAnalysisRequest, SkillAnalysisResponse,
    ProfileGenerationRequest, ProfileGenerationResponse,
    AIChatRequest
)
from app.agents.skill_agent import analyze_skills
from app.agents.profile_agent import generate_profile
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

@router.post("/analyze-skills", response_model=SkillAnalysisResponse)
def analyze_skills_endpoint(payload: SkillAnalysisRequest):
    result = analyze_skills(payload.description)
    return result

@router.post("/generate-profile", response_model=ProfileGenerationResponse)
def generate_profile_endpoint(payload: ProfileGenerationRequest):
    result = generate_profile(
        skills=payload.skills,
        experience_years=payload.experience_years,
        services=payload.services
    )
    return result

@router.post("/chat")
def ai_chat_endpoint(payload: AIChatRequest):
    user_msg = payload.message.lower()

    if GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = f"""
You are SilverHands Assistant, a helpful guide for senior citizens and homemakers in India offering or looking for home services.
Answer the user's question concisely, respectfully, and clearly (2-3 sentences max).

User Question: "{payload.message}"
"""
            response = client.models.generate_content(
                model="models/gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            if response and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            print(f"[AIChat] Gemini chat error: {e}")

    # Fallback answers for key questions
    if "profile" in user_msg or "create" in user_msg or "start" in user_msg:
        reply = "To create your profile, click 'Share My Skills' at the top, describe what you love doing (like cooking, tutoring, or tailoring), and our AI will automatically organize your profile!"
    elif "service" in user_msg or "offer" in user_msg:
        reply = "You can offer traditional cooking, catering, tutoring, tailoring, handicrafts, terrace gardening, childcare, classical music/dance, or language lessons."
    elif "skill" in user_msg or "add" in user_msg:
        reply = "You can add any skill you have built over the years. Simply describe your experience in natural words, and our system extracts and highlights your strengths."
    else:
        reply = "Welcome to SilverHands! We connect experienced senior citizens and homemakers with local neighbors who need their valuable skills. You can share your skills or find local services anytime."

    return {"reply": reply}
