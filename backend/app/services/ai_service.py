import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def extract_skills_from_text(raw_prompt: str, preferred_category: Optional[str] = None) -> Dict[str, Any]:
    """
    Skill & Profile AI Agent:
    Extracts structured skill data, recommended pricing, and warm bio copy from natural language prompt.
    Uses Google Gemini API if key is present; otherwise returns intelligent structured heuristic output.
    """
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
            system_instruction = """You are the SilverHands AI Skill Extraction Agent. Analyze the senior citizen's or homemaker's natural language input and extract structured JSON with:
            {
              "skills": [
                {
                  "title": "Skill title",
                  "category": "Cooking|Tutoring|Crafts & Tailoring|Gardening|Consulting & Mentoring|Home Maintenance",
                  "proficiency_level": "Expert|Master",
                  "years_experience": number,
                  "suggested_hourly_rate": number,
                  "suggested_bio": "Warm senior bio",
                  "key_highlights": ["Highlight 1", "Highlight 2"]
                }
              ],
              "generated_profile_bio": "Warm engaging profile bio for the senior",
              "ai_mentor_tip": "Friendly pricing and encouragement tip for senior"
            }
            Respond with VALID JSON ONLY."""
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_instruction}\n\nSenior Prompt: {raw_prompt}"}
                        ]
                    }
                ]
            }
            
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text_content = data['candidates'][0]['content']['parts'][0]['text']
                    # Clean json fence
                    clean_json = text_content.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(clean_json)
                    parsed["success"] = True
                    return parsed
        except Exception as e:
            logger.warning(f"Gemini API call failed or timed out: {e}")

    # Heuristic Intelligent Fallback
    category = preferred_category or "Cooking & Baking"
    if "cook" in raw_prompt.lower() or "bake" in raw_prompt.lower() or "recipe" in raw_prompt.lower():
        category = "Cooking & Baking"
        title = "Traditional Home Cooking & Baking"
        bio = "Passionate home cook with decades of experience creating wholesome traditional meals, preserves, and family recipes."
        highlights = ["Traditional Family Recipes", "Hygiene & Custom Diets", "Patience & Teaching"]
        rate = 30.0
    elif "teach" in raw_prompt.lower() or "tutor" in raw_prompt.lower() or "math" in raw_prompt.lower() or "read" in raw_prompt.lower():
        category = "Tutoring & Mentoring"
        title = "Senior Academic & Life Skills Tutor"
        bio = "Dedicated former educator offering patient personalized tutoring, reading support, and foundational learning for kids and teens."
        highlights = ["30+ Years Teaching Experience", "Patient Step-by-Step Approach", "Encouraging Environment"]
        rate = 35.0
    elif "sew" in raw_prompt.lower() or "tailor" in raw_prompt.lower() or "craft" in raw_prompt.lower() or "knit" in raw_prompt.lower():
        category = "Crafts & Tailoring"
        title = "Master Tailoring & Artisan Crafts"
        bio = "Skilled artisan with decades of experience in custom alterations, embroidery, knitting, and handmade home décor."
        highlights = ["Precision Stitching & Alterations", "Handmade Craft Design", "Sustainable Upcycling"]
        rate = 28.0
    else:
        category = "Consulting & Mentoring"
        title = "Senior Life & Career Consultant"
        bio = "Experienced senior professional providing empathetic guidance, practical advice, and lifelong wisdom."
        highlights = ["Lifelong Wisdom", "Active Listener", "Flexible Scheduling"]
        rate = 40.0

    return {
        "success": True,
        "skills": [
            {
                "title": title,
                "category": category,
                "proficiency_level": "Master",
                "years_experience": 25,
                "suggested_hourly_rate": rate,
                "suggested_bio": bio,
                "key_highlights": highlights
            }
        ],
        "generated_profile_bio": bio,
        "ai_mentor_tip": "Starting at a modest hourly rate helps build early verified 5-star reviews on SilverHands!"
    }


def generate_match_explanation(
    customer_query: str,
    provider_name: str,
    service_title: str,
    category: str,
    distance_km: float,
    match_score: float,
    years_experience: int,
    rating: float
) -> str:
    """Generates warm personalized AI rationale explaining why this senior provider matches the customer's need."""
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
            prompt = f"Customer Query: '{customer_query}'. Senior Provider: '{provider_name}' offering '{service_title}' ({category}). Distance: {distance_km}km, Match Score: {match_score}/100, Experience: {years_experience} years, Rating: {rating}/5. Write 2 friendly, concise sentences explaining why this senior citizen is a great fit."
            
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            with httpx.Client(timeout=8.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data['candidates'][0]['content']['parts'][0]['text'].strip()
        except Exception:
            pass

    return f"{provider_name} has over {years_experience} years of hands-on expertise in {category.lower()} and is located just {distance_km}km away with an outstanding {rating}★ rating."


def generate_senior_mentor_response(message: str, user_context: str = "senior_provider") -> Dict[str, Any]:
    """Senior Business Mentor AI Bot guidance."""
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
            system_prompt = "You are 'SilverBot', a warm, encouraging, respectful business and platform mentor for senior citizens and homemakers on SilverHands. Provide reassuring, practical advice in short clear paragraphs."
            
            payload = {"contents": [{"parts": [{"text": f"{system_prompt}\n\nSenior Question: {message}"}]}]}
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    text = res.json()['candidates'][0]['content']['parts'][0]['text'].strip()
                    return {
                        "reply": text,
                        "suggested_actions": ["How should I set my hourly rate?", "Tips for safety during home visits", "How to request a review after a job"]
                    }
        except Exception:
            pass

    # High quality pre-built senior mentor guidance
    msg_lower = message.lower()
    if "price" in msg_lower or "rate" in msg_lower or "charge" in msg_lower:
        reply = "Hello! Setting your pricing on SilverHands is simple. We recommend starting with a fair rate between $20 and $35 per hour based on your experience. As you complete jobs and gather 5-star reviews from happy neighbors, you can confidently adjust your rate upward!"
        actions = ["Calculate recommended rate", "View average local rates", "How to offer packages"]
    elif "safety" in msg_lower or "visit" in msg_lower or "trust" in msg_lower:
        reply = "Your comfort and safety are our top priority! Always confirm booking details through the SilverHands platform before a meeting. For your first session, consider bringing a friend or family member or meeting in a comfortable public or home environment."
        actions = ["View verification badge status", "Emergency contact support", "Share itinerary with family"]
    else:
        reply = f"Welcome to SilverHands! I am your personal digital mentor. Whether you want to share home cooking secrets, offer tutoring, or craft custom goods, I am here to assist you every step of the way."
        actions = ["Extract skills with AI", "Browse nearby requests", "Update profile picture"]

    return {
        "reply": reply,
        "suggested_actions": actions
    }
