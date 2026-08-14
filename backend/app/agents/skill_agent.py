import os
import json
import re
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def analyze_skills_fallback(text: str) -> Dict[str, Any]:
    """
    Deterministic fallback when Gemini API is unavailable or fails.
    Extracts basic categories, experience years, skills, and services strictly from input text.
    """
    text_lower = text.lower()
    
    # Extract experience years if explicitly stated
    exp_match = re.search(r'(\d+)\s*\+?\s*(?:years?|yrs?)', text_lower)
    experience_years = int(exp_match.group(1)) if exp_match else 0
    
    skills = []
    services = []
    keywords = []
    category = "General Livelihood"
    suggested_title = "Home Service Specialist"

    # Strictly grounded keyword extraction
    if any(k in text_lower for k in ["sweet", "cook", "food", "snack", "murukku", "adhirasam", "seedai", "catering", "tiffin"]):
        category = "Food & Catering"
        if any(k in text_lower for k in ["sweet", "murukku", "adhirasam", "seedai", "snack"]):
            skills.append("Traditional Sweets & Snacks")
            services.append("Homemade Sweets & Snacks")
            keywords.extend(["sweets", "snacks", "traditional food"])
        if any(k in text_lower for k in ["cook", "food", "catering", "tiffin"]):
            skills.append("Home Cooking")
            services.append("Home Cooking & Catering")
            keywords.append("home cooking")
        suggested_title = "Traditional Food & Snack Specialist"
        
    elif any(k in text_lower for k in ["tailor", "stitch", "embroidery", "blouse", "saree", "sew"]):
        category = "Tailoring & Handicrafts"
        if any(k in text_lower for k in ["blouse", "stitch", "tailor", "saree"]):
            skills.append("Saree Blouse Stitching")
            services.append("Custom Saree Blouse Stitching")
            keywords.extend(["tailoring", "blouse stitching"])
        if "embroidery" in text_lower:
            skills.append("Hand Embroidery")
            services.append("Hand Embroidery")
            keywords.append("hand embroidery")
        if any(k in text_lower for k in ["alteration", "alter", "fitting"]):
            skills.append("Garment Alteration")
            services.append("Garment Alteration & Fitting")
            keywords.append("alteration")
        suggested_title = "Tailoring & Embroidery Specialist"
        
    elif any(k in text_lower for k in ["hindi", "math", "mathematics", "tutor", "teach", "school", "children", "language"]):
        category = "Education & Tutoring"
        if "hindi" in text_lower:
            skills.append("Hindi Language Teaching")
            services.append("Hindi Tutoring for Children")
            keywords.extend(["Hindi tutor", "language teaching"])
        if any(k in text_lower for k in ["math", "mathematics"]):
            skills.append("Mathematics Tutoring")
            services.append("Math Tutoring")
            keywords.extend(["math tutor", "teaching"])
        if not skills:
            skills.append("Tutoring & Teaching")
            services.append("Home Tutoring")
            keywords.append("tutoring")
        suggested_title = "Academic & Language Tutor"
        
    elif any(k in text_lower for k in ["dance", "bharatanatyam", "carnatic", "music", "vocal"]):
        category = "Arts & Culture"
        skills.append("Classical Music & Dance Instruction")
        services.append("Classical Arts Lessons")
        keywords.extend(["classical arts", "music", "dance"])
        suggested_title = "Classical Arts Instructor"
        
    elif any(k in text_lower for k in ["garden", "terrace", "plant", "organic"]):
        category = "Gardening & Home Care"
        skills.append("Terrace & Home Gardening")
        services.append("Organic Terrace Garden Setup")
        keywords.extend(["gardening", "plant care"])
        suggested_title = "Terrace Gardening Specialist"
        
    elif any(k in text_lower for k in ["childcare", "babysit", "children", "storytelling"]):
        category = "Childcare & Eldercare"
        skills.append("Childcare & Storytelling")
        services.append("After-School Childcare")
        keywords.extend(["childcare", "storytelling"])
        suggested_title = "Childcare & Storytelling Provider"

    if not skills:
        skills = ["Home Services"]
        services = ["Personalized Home Service"]
        keywords = ["home service"]

    return {
        "skills": list(dict.fromkeys(skills)),
        "category": category,
        "experience_years": experience_years,
        "services": list(dict.fromkeys(services)),
        "keywords": list(dict.fromkeys(keywords)),
        "suggested_title": suggested_title
    }

def analyze_skills(description: str) -> Dict[str, Any]:
    """
    Extract structured skill information strictly grounded in natural language input.
    Uses Gemini API if available, with deterministic fallback.
    """
    if not description or not description.strip():
        return analyze_skills_fallback("")

    if not GEMINI_API_KEY:
        return analyze_skills_fallback(description)

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""
You are an expert AI skill extractor for SilverHands, a platform empowering senior citizens and homemakers in India.
Analyze the user's natural-language description and extract structured skill information into JSON.

User Description:
"{description}"

STRICT GROUNDING RULES:
1. Treat the user's description as the ONLY source of truth.
2. NEVER invent experience_years, qualifications, certifications, services, skills, job history, locations, pricing, or customer types.
3. experience_years:
   - If the user explicitly states a duration in years (e.g. "20 years", "5 yrs"), extract that integer (e.g. 20).
   - If no duration is explicitly stated, return 0.
   - NEVER estimate, infer, or default experience_years if not explicitly stated in numbers.
4. services:
   - Extract ONLY services explicitly stated or directly equivalent to the user's stated activity.
   - Do NOT expand or exaggerate (e.g. do NOT change "embroidery" to "designer embroidery", do NOT add "garment alteration" unless alteration is explicitly mentioned).
5. skills:
   - Extract ONLY skills clearly supported by the description.
6. category:
   - Choose the single best category based ONLY on stated skills (e.g. Food & Catering, Tailoring & Handicrafts, Education & Tutoring, Arts & Culture, Gardening & Home Care, Childcare & Eldercare).
7. suggested_title:
   - Create a professional title derived ONLY from explicitly identified skills. Do NOT add unsupported qualifications or experience.

Respond strictly with valid JSON conforming to this schema:
{{
  "skills": ["3-5 concise skill names supported strictly by the text"],
  "category": "Primary category name",
  "experience_years": integer number of experience years (0 if not explicitly mentioned),
  "services": ["2-4 concrete service offerings supported strictly by the text"],
  "keywords": ["4-6 search keywords"],
  "suggested_title": "Respectful professional title"
}}
"""
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0,
            )
        )
        if response and response.text:
            data = json.loads(response.text)
            exp_val = data.get("experience_years")
            exp_int = int(exp_val) if exp_val is not None and str(exp_val).isdigit() else 0

            return {
                "skills": data.get("skills", []),
                "category": data.get("category", "General Livelihood"),
                "experience_years": exp_int,
                "services": data.get("services", []),
                "keywords": data.get("keywords", []),
                "suggested_title": data.get("suggested_title", "Home Service Specialist")
            }
    except Exception as e:
        print(f"[SkillAgent] Gemini call failed or unavailable: {e}. Using deterministic fallback.")
    
    return analyze_skills_fallback(description)
