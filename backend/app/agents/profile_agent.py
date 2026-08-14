import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def generate_profile_fallback(skills: List[str], experience_years: int, services: List[str]) -> Dict[str, Any]:
    """
    Deterministic fallback for profile generation when Gemini API is offline/unavailable.
    Applies strict grounding rules: no 0 years of experience claims.
    """
    primary_skill = skills[0] if skills else "Handcrafted Services"
    all_skills_str = ", ".join(skills) if skills else "Traditional Skills"
    
    suggested_title = f"{primary_skill} Specialist"
    
    if experience_years > 0:
        bio = f"Dedicated specialist with over {experience_years} years of experience in {all_skills_str}, providing authentic quality work directly from home."
    else:
        bio = f"Skilled in {all_skills_str}, offering authentic home-based services."
    
    service_descriptions = [
        f"{s}: Handcrafted with care and personalized attention." for s in services
    ] if services else ["Custom High Quality Home Service"]
    
    keywords = [s.lower() for s in skills] + ["home based provider"]
    
    return {
        "suggested_title": suggested_title,
        "bio": bio,
        "service_descriptions": service_descriptions,
        "keywords": list(set(keywords))
    }

def generate_profile(skills: List[str], experience_years: int, services: List[str]) -> Dict[str, Any]:
    """
    Generate professional title, warm grounded bio, service descriptions, and keywords using Gemini API or fallback.
    """
    if not GEMINI_API_KEY:
        return generate_profile_fallback(skills, experience_years, services)

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""
You are an expert profile biographer for SilverHands, a platform empowering senior citizens and homemakers in India.
Generate a dignified, professional profile based ONLY on the provided information:
- Skills: {skills}
- Experience: {experience_years} years
- Services: {services}

STRICT GROUNDING RULES:
1. Treat the input skills, experience, and services as the ONLY source of truth.
2. If experience_years is 0, do NOT mention years of experience or "0 years of experience". Use neutral wording such as: "Skilled in {', '.join(skills) if skills else 'home services'}, offering home-based services."
3. Do NOT invent unsupported experience, certifications, qualifications, or extra services.
4. Keep the bio respectful, warm, concise (2-3 sentences max), and strictly factual.

Respond strictly with valid JSON conforming to this schema:
{{
  "suggested_title": "Professional title derived strictly from skills",
  "bio": "Strictly grounded warm 2-3 sentence biography",
  "service_descriptions": ["1-sentence description for each service provided"],
  "keywords": ["List of search keywords"]
}}
"""
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
        )
        if response and response.text:
            data = json.loads(response.text)
            return {
                "suggested_title": data.get("suggested_title", f"{skills[0]} Specialist" if skills else "Home Provider"),
                "bio": data.get("bio", f"Skilled provider offering home-based services."),
                "service_descriptions": data.get("service_descriptions", []),
                "keywords": data.get("keywords", [])
            }
    except Exception as e:
        print(f"[ProfileAgent] Gemini call failed: {e}. Using deterministic fallback.")

    return generate_profile_fallback(skills, experience_years, services)
