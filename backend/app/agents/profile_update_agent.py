import os
import json
import re
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def parse_profile_update_fallback(text: str) -> Dict[str, Any]:
    """
    Deterministic fallback for parsing natural language profile update requests.
    """
    text_lower = text.lower()
    
    if any(k in text_lower for k in ["delete profile", "remove my profile", "close account"]):
        return {
            "intent": "DELETE_PROFILE",
            "summary": "You requested to permanently delete your SilverHands provider profile.",
            "target_field": "profile",
            "value": "delete",
            "draft_update": {}
        }
    
    # Experience update
    exp_match = re.search(r'(\d+)\s*\+?\s*(?:years?|yrs?)', text_lower)
    if exp_match and any(k in text_lower for k in ["experience", "years", "now"]):
        yrs = int(exp_match.group(1))
        return {
            "intent": "UPDATE_EXPERIENCE",
            "summary": f"Update your total experience to {yrs} years.",
            "target_field": "experience_years",
            "value": str(yrs),
            "draft_update": {"experience_years": yrs}
        }
    
    # Add service
    if any(k in text_lower for k in ["add", "offer", "started", "now teach", "now make", "also provide"]):
        service_name = text.strip()
        if "teach" in text_lower or "tutoring" in text_lower or "hindi" in text_lower:
            service_name = "Hindi Tutoring for Children"
        elif "cook" in text_lower or "food" in text_lower:
            service_name = "Home Cooking & Snacks"
            
        return {
            "intent": "ADD_SERVICE",
            "summary": f"Add '{service_name}' to your service offerings.",
            "target_field": "services",
            "value": service_name,
            "draft_update": {"services": [service_name]}
        }
        
    # Default update draft
    return {
        "intent": "UPDATE_PROFILE",
        "summary": f"Update profile details based on: '{text}'",
        "target_field": "bio",
        "value": text,
        "draft_update": {"bio": text}
    }

def parse_profile_update(text: str) -> Dict[str, Any]:
    """
    Parses a natural-language profile update request into a structured draft proposal.
    MUST NOT modify the database directly — returns a confirmation draft for user review.
    """
    if not text or not text.strip():
        return parse_profile_update_fallback("")

    if not GEMINI_API_KEY:
        return parse_profile_update_fallback(text)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""
You are an expert NLP update assistant for SilverHands.
Analyze the user's natural-language profile update request and parse it into a structured confirmation draft JSON.

User Statement: "{text}"

CATEGORIES OF INTENT:
- ADD_SERVICE: User wants to offer a new service (e.g. "I now teach Hindi to children up to age 16").
- REMOVE_SERVICE: User wants to stop offering a service.
- ADD_SKILL: User wants to add a skill.
- REMOVE_SKILL: User wants to remove a skill.
- UPDATE_EXPERIENCE: User updated years of experience.
- UPDATE_LOCATION: User changed location/address.
- DELETE_PROFILE: User wants to delete profile.

Respond strictly in valid JSON conforming to this schema:
{{
  "intent": "ADD_SERVICE | REMOVE_SERVICE | ADD_SKILL | REMOVE_SKILL | UPDATE_EXPERIENCE | UPDATE_LOCATION | DELETE_PROFILE",
  "summary": "Clear, friendly sentence describing what will be updated upon user confirmation",
  "target_field": "services | skills | experience_years | location | bio",
  "value": "Extracted main value",
  "draft_update": {{
     "services": ["Extracted service name if intent is ADD_SERVICE"],
     "skills": ["Extracted skill name if intent is ADD_SKILL"],
     "experience_years": integer_or_null,
     "location": "location string or null",
     "target_age_group": "age group string or null"
  }}
}}
"""
        response = client.models.generate_content(
            model="models/gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0
            )
        )
        if response and response.text:
            data = json.loads(response.text)
            return data
    except Exception as e:
        print(f"[ProfileUpdateAgent] Gemini error: {e}. Using fallback.")

    return parse_profile_update_fallback(text)
