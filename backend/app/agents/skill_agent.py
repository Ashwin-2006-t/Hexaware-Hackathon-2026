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
    
    # Extract experience years if explicitly stated (e.g. "20 years", "5 yrs")
    exp_match = re.search(r'(\d+)\s*\+?\s*(?:years?|yrs?)', text_lower)
    experience_years = int(exp_match.group(1)) if exp_match else None

    # Extract target age group if explicitly mentioned
    target_age_group = None
    age_match = re.search(r'(?:till|up to|under|age)\s*(\d+)', text_lower)
    if age_match:
        target_age_group = f"Children up to age {age_match.group(1)}"
    elif "children" in text_lower or "kids" in text_lower:
        target_age_group = "Children"
    
    skills = []
    services = []
    keywords = []
    languages = []
    category = "General Livelihood"
    suggested_title = "Home Service Specialist"

    if "hindi" in text_lower:
        languages.append("Hindi")
    if "tamil" in text_lower:
        languages.append("Tamil")
    if "english" in text_lower:
        languages.append("English")

    # Strictly grounded keyword extraction
    if any(k in text_lower for k in ["sweet", "cook", "food", "snack", "murukku", "adhirasam", "seedai", "catering", "tiffin", "dosa", "chapati", "biryani", "gravy", "function"]):
        category = "Food & Catering"
        if any(k in text_lower for k in ["sweet", "murukku", "adhirasam", "seedai", "snack"]):
            skills.append("Traditional Sweets & Snacks")
            services.append("Homemade Sweets & Snacks")
            keywords.extend(["sweets", "snacks", "traditional food"])
        if "dosa" in text_lower:
            skills.append("Dosa Preparation")
            services.append("Dosa Preparation")
        if "chapati" in text_lower:
            skills.append("Chapati Preparation")
            services.append("Chapati Preparation")
        if "biryani" in text_lower:
            skills.append("Biryani Preparation")
            services.append("Biryani Preparation")
        if "gravy" in text_lower:
            skills.append("Curry & Gravy Preparation")
            services.append("Curry & Gravy Preparation")
        if "function" in text_lower:
            skills.append("Function Catering")
            services.append("Function Catering")
        if any(k in text_lower for k in ["cook", "food", "catering", "tiffin"]) and not skills:
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
            skills.append("Child Tutoring")
            services.append("Hindi Tutoring for Children")
            keywords.extend(["Hindi tutor", "language teaching", "tutoring"])
            suggested_title = "Hindi Language Tutor"
        if "tamil" in text_lower:
            skills.append("Tamil Language Teaching")
            services.append("Tamil Tutoring")
            keywords.extend(["Tamil tutor", "language teaching"])
            suggested_title = "Tamil Language Tutor"
        if any(k in text_lower for k in ["math", "mathematics"]):
            skills.append("Mathematics Tutoring")
            services.append("Math Tutoring")
            keywords.extend(["math tutor", "teaching"])
            if "hindi" not in text_lower and "tamil" not in text_lower:
                suggested_title = "Mathematics Tutor"
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
        
    elif any(k in text_lower for k in ["childcare", "babysit", "storytelling"]):
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
        "skills": sanitize_extracted_skills(category, list(dict.fromkeys(skills)), text),
        "category": category,
        "experience_years": experience_years,
        "target_age_group": target_age_group,
        "languages": list(dict.fromkeys(languages)),
        "services": list(dict.fromkeys(services)),
        "keywords": list(dict.fromkeys(keywords)),
        "suggested_title": suggested_title
    }

UNRELATED_SKILLS_FOR_FOOD = ["tailoring", "embroidery", "blouse", "stitching", "aari", "garment alteration", "tutoring", "gardening"]
UNRELATED_SKILLS_FOR_TAILORING = ["cooking", "sweets", "catering", "dosa", "food", "tutoring", "gardening"]
UNRELATED_SKILLS_FOR_TUTORING = ["tailoring", "embroidery", "cooking", "sweets", "catering", "gardening"]

def sanitize_extracted_skills(category: str, skills: list, text: str) -> list:
    text_lower = text.lower()
    clean_skills = []
    
    is_food = any(k in text_lower for k in ["sweet", "cook", "food", "snack", "murukku", "adhirasam", "seedai", "catering", "tiffin", "dosa", "chapati", "biryani", "gravy", "kitchen"])
    is_tailor = any(k in text_lower for k in ["tailor", "stitch", "embroidery", "blouse", "saree", "sew", "aari", "alteration"])
    is_tutor = any(k in text_lower for k in ["tutor", "teach", "lesson", "hindi", "tamil", "math", "homework"])

    for s in skills:
        s_lower = s.lower()
        if is_food and not is_tailor and any(un in s_lower for un in UNRELATED_SKILLS_FOR_FOOD):
            continue
        if is_tailor and not is_food and any(un in s_lower for un in UNRELATED_SKILLS_FOR_TAILORING):
            continue
        if is_tutor and not is_food and not is_tailor and any(un in s_lower for un in UNRELATED_SKILLS_FOR_TUTORING):
            continue
        clean_skills.append(s)
        
    return clean_skills

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

STRICT GROUNDING & HALLUCINATION PREVENTION RULES:
1. Treat the user's description as the ONLY source of truth.
2. NEVER invent experience_years, qualifications, certifications, subjects, services, skills, job history, locations, or pricing.
3. experience_years:
   - Extract integer ONLY if explicitly stated in numbers/words (e.g. "20 years", "5 yrs" -> 20, 5).
   - If NO duration is explicitly stated, return null. DO NOT guess, estimate, or assign 10 or 5 years.
4. target_age_group:
   - Extract age group ONLY if mentioned (e.g. "children till age 16" -> "Children up to age 16"). Otherwise return null.
5. languages:
   - Extract languages mentioned (e.g. ["Hindi"]).
6. services & skills:
   - Extract ALL distinct, meaningful skills & services explicitly present in the text.
   - DO NOT artificially collapse multiple mentioned dishes or tasks into a single generic tag.
   - Example: If text says "I make dosa, chapati, chicken gravy and chicken biryani for functions", skills MUST include ["Dosa Preparation", "Chapati Preparation", "Chicken Gravy", "Chicken Biryani", "Function Catering"], category "Food & Catering".
   - Example: If text says "I am good in Hindi and ready to teach children till age 16", skills must be ["Hindi Language", "Hindi Teaching", "Child Tutoring"], category "Education & Tutoring", experience_years null, target_age_group "Children up to age 16". NEVER add Mathematics or Exam Preparation unless math is mentioned.

Respond strictly with valid JSON conforming to this schema:
{{
  "skills": ["concise skill names supported strictly by the text"],
  "category": "Primary category name",
  "experience_years": integer or null (null if not explicitly stated),
  "target_age_group": string or null,
  "languages": ["Languages stated or implied"],
  "services": ["service offerings supported strictly by the text"],
  "keywords": ["search keywords"],
  "suggested_title": "Respectful professional title"
}}
"""
        response = client.models.generate_content(
            model="models/gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0,
            )
        )
        if response and response.text:
            data = json.loads(response.text)
            exp_val = data.get("experience_years")
            exp_int = int(exp_val) if exp_val is not None and str(exp_val).isdigit() else None

            # Validation guard: If input does not contain numbers, force experience_years to None
            if not re.search(r'\d+', description) and not re.search(r'\b(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty)\b', description.lower()):
                exp_int = None

            raw_category = data.get("category", "General Livelihood")
            raw_skills = data.get("skills", [])
            clean_skills = sanitize_extracted_skills(raw_category, raw_skills, description)

            return {
                "skills": clean_skills,
                "category": raw_category,
                "experience_years": exp_int,
                "target_age_group": data.get("target_age_group"),
                "languages": data.get("languages", []),
                "services": data.get("services", []),
                "keywords": data.get("keywords", []),
                "suggested_title": data.get("suggested_title", "Home Service Specialist")
            }
    except Exception as e:
        print(f"[SkillAgent] Gemini call failed or unavailable: {e}. Using deterministic fallback.")
    
    return analyze_skills_fallback(description)
