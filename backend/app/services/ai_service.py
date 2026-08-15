import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try importing official google-genai SDK
genai_sdk_available = False
try:
    from google import genai
    from google.genai import types
    genai_sdk_available = True
except ImportError:
    logger.warning("google-genai SDK not imported directly; fallback active.")


def get_genai_client():
    """Initializes and returns Google GenAI client if a real API key is present."""
    key = (settings.GEMINI_API_KEY or "").strip()
    if genai_sdk_available and key and len(key) > 8 and not key.startswith("****") and key != "your-gemini-api-key":
        try:
            return genai.Client(api_key=key)
        except Exception as e:
            logger.warning(f"Failed to initialize GenAI Client: {e}")
    return None


def get_candidate_models() -> List[str]:
    """Returns prioritized candidate models for dynamic AI generations."""
    primary = (settings.GEMINI_MODEL or "").strip() or "gemini-flash-latest"
    candidates = [primary, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
    # De-duplicate while preserving order
    seen = set()
    return [m for m in candidates if not (m in seen or seen.add(m))]


def call_gemini_with_fallback(client, prompt: str) -> Optional[str]:
    """Tries generating content with candidate models to handle transient 503 or rate spikes."""
    models = get_candidate_models()
    for model_name in models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.info(f"Model {model_name} attempt failed: {e}. Trying next candidate...")
            continue
    return None


def extract_skills_from_text(raw_prompt: str, preferred_category: Optional[str] = None) -> Dict[str, Any]:
    """
    1. Skill ID Agent:
    Extracts structured skill data, Indian currency pricing recommendations (in ₹ INR),
    and a warm, simple, honest biography grounded ONLY in user-supplied facts.
    """
    client = get_genai_client()
    if client:
        try:
            prompt = f"""You are the SilverHands AI Assistant for senior citizens and homemakers in India.
Tagline: "Turning Lifelong Skills Into New Opportunities."
Analyze the user's natural language experience description: "{raw_prompt}".
Preferred Category (if provided): "{preferred_category or 'None'}".

CRITICAL RULES:
- Ground all information ONLY in what the user provided. Do not invent certifications or false credentials.
- Price suggestions must be realistic in Indian Rupees (₹ INR), typically ₹250 - ₹600/hr.
- Return VALID JSON ONLY with this exact schema:
{{
  "skills": [
    {{
      "title": "Skill title",
      "category": "Cooking & Tiffin|Tutoring & Mentoring|Crafts & Tailoring|Gardening & Agriculture|Consulting & Life Mentoring|Home Maintenance",
      "proficiency_level": "Expert|Master",
      "years_experience": number,
      "suggested_hourly_rate": number,
      "suggested_bio": "Simple, warm, honest bio grounded only in user input",
      "key_highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
    }}
  ],
  "generated_profile_bio": "Simple, warm, honest profile bio in plain English",
  "ai_mentor_tip": "Encouraging pricing and customer tip for informal Indian market in ₹ INR"
}}"""
            text = call_gemini_with_fallback(client, prompt)
            if text:
                clean_json = text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                parsed["ai_available"] = True
                parsed["success"] = True
                return parsed
        except Exception as e:
            logger.warning(f"Gemini API call failed for extract_skills: {e}")

    # Deterministic fallback grounded in user input keywords (Never crash)
    category = preferred_category or "Cooking & Tiffin"
    raw_lower = raw_prompt.lower()
    
    if any(w in raw_lower for w in ["cook", "bake", "recipe", "tiffin", "pickle", "papad", "food", "kitchen", "south indian", "north indian", "coffee"]):
        category = "Cooking & Tiffin"
        title = "Authentic Home Tiffin & Traditional Cooking"
        bio = "Experienced home chef skilled in wholesome regional recipes, authentic pickles, and hygienic daily tiffin preparation."
        highlights = ["Authentic Family Recipes", "Hygienic Home Cooking", "Custom Diet Preferences"]
        rate = 300.0
        exp = 25
    elif any(w in raw_lower for w in ["teach", "tutor", "math", "read", "music", "school", "tuition", "science"]):
        category = "Tutoring & Mentoring"
        title = "Patient School Academic & Foundational Tutor"
        bio = "Dedicated senior educator offering patient one-on-one academic tutoring, foundational reading, and school exam prep."
        highlights = ["25+ Years Teaching Experience", "Patient Step-by-Step Mentoring", "Flexible Timings"]
        rate = 400.0
        exp = 30
    elif any(w in raw_lower for w in ["sew", "tailor", "craft", "knit", "saree", "stitching", "alteration", "blouse", "embroidery"]):
        category = "Crafts & Tailoring"
        title = "Saree Blouse Tailoring & Artisan Sewing"
        bio = "Skilled artisan with decades of experience in saree blouse stitching, dress modifications, and hand embroidery."
        highlights = ["Precision Stitching & Fitting", "Custom Saree Blouses", "Handmade Craft Upcycling"]
        rate = 350.0
        exp = 28
    elif any(w in raw_lower for w in ["garden", "plant", "terrace", "farming", "organic", "vegetable"]):
        category = "Gardening & Agriculture"
        title = "Terrace Organic Gardening & Plant Care"
        bio = "Passionate terrace gardener specializing in balcony kitchen gardens, organic pest control, and potting guidance."
        highlights = ["Organic Vegetable Cultivation", "Urban Balcony Setup", "Composting & Natural Care"]
        rate = 350.0
        exp = 20
    else:
        category = "Consulting & Life Mentoring"
        title = "Senior Career & Life Guidance Mentor"
        bio = "Experienced senior professional offering empathetic career guidance, practical wisdom, and personal mentoring."
        highlights = ["Lifelong Professional Experience", "Empathetic Listener", "Practical Guidance"]
        rate = 500.0
        exp = 35

    return {
        "ai_available": False,
        "ai_message": "AI assistance is temporarily unavailable. Loaded structured profile fallback.",
        "success": True,
        "skills": [
            {
                "title": title,
                "category": category,
                "proficiency_level": "Master",
                "years_experience": exp,
                "suggested_hourly_rate": rate,
                "suggested_bio": bio,
                "key_highlights": highlights
            }
        ],
        "generated_profile_bio": bio,
        "ai_mentor_tip": "Setting a competitive rate in ₹ INR (e.g. ₹250-₹400/hr) helps build early 5-star verified reviews on SilverHands!"
    }


def generate_profile_builder(
    name: str,
    skills: List[str],
    experience_years: int,
    location: str,
    interests: Optional[str] = None
) -> Dict[str, Any]:
    """
    2. AI Profile Builder Agent:
    Takes user-supplied facts and generates an honest, dignified headline and about bio.
    Never invents credentials or unverified certifications.
    """
    client = get_genai_client()
    skills_str = ", ".join(skills) if skills else "Home cooking, crafts and mentoring"
    if client:
        try:
            prompt = f"""You are the AI Profile Builder for SilverHands (livelihood platform for Indian seniors and homemakers).
User Name: {name}
Skills: {skills_str}
Years of Experience: {experience_years}
Location: {location}
Additional Interests: {interests or 'None'}

CRITICAL RULES:
- Never exaggerate or invent degrees, certifications, or past employers.
- Write a dignified, warm, and authentic profile headline and 3-paragraph 'About Me' in plain English.
- Return VALID JSON ONLY:
{{
  "headline": "Short compelling headline (max 12 words)",
  "about_text": "3-4 sentences describing their authentic experience, approach, and how they help local neighbors.",
  "suggested_services": [
    {{
      "title": "Service Title",
      "category": "Cooking & Tiffin|Tutoring & Mentoring|Crafts & Tailoring|Gardening & Agriculture|Consulting & Life Mentoring|Home Maintenance",
      "price_per_hour": 350.0
    }}
  ]
}}"""
            text = call_gemini_with_fallback(client, prompt)
            if text:
                clean_json = text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                return {
                    "success": True,
                    "ai_available": True,
                    "headline": parsed.get("headline", f"Experienced {skills[0] if skills else 'Craftsman'} with {experience_years}+ Years Expertise"),
                    "about_text": parsed.get("about_text", f"Namaste! I am {name}, based in {location}. With over {experience_years} years of practical experience in {skills_str}, I take joy in sharing authentic skills and helping neighbors."),
                    "suggested_services": parsed.get("suggested_services", []),
                    "is_ai_assisted": True,
                    "notice": "AI-assisted — please verify before publishing"
                }
        except Exception as e:
            logger.warning(f"Gemini API call failed for profile builder: {e}")

    # Fallback Profile
    first_skill = skills[0] if skills else "Traditional Cooking & Crafts"
    return {
        "success": True,
        "ai_available": False,
        "headline": f"Skilled Senior Mentor with {experience_years}+ Years of Authentic Expertise in {first_skill}",
        "about_text": f"Namaste! I am {name}, located in {location}. Over {experience_years} years of dedicated practice in {skills_str} have given me deep hands-on expertise. I am passionate about offering reliable, personalized service and passing down lifelong knowledge to families in my community.",
        "suggested_services": [
            {
                "title": f"Authentic {first_skill} Sessions",
                "category": "Cooking & Tiffin" if "cook" in first_skill.lower() else "Crafts & Tailoring",
                "price_per_hour": 350.0
            }
        ],
        "is_ai_assisted": True,
        "notice": "AI-assisted — please verify before publishing"
    }


def generate_business_guidance(query: str, location: str = "Mumbai, Maharashtra") -> Dict[str, Any]:
    """
    3. Business Guidance Agent:
    e.g. "sell homemade pickles" or "offer math tuition" -> structured sectioned cards:
    Idea summary, Target customers, Pricing in ₹ INR, Marketing & local outreach, First 3 steps, Packaging & hygiene.
    India-specific, no legal/tax claims stated as fact.
    """
    client = get_genai_client()
    if client:
        try:
            prompt = f"""You are the SilverHands Business Guide for senior citizens and homemakers in India.
The user wants guidance on: "{query}" located in "{location}".

Provide a structured, encouraging, India-specific micro-business plan.
Mention prices and rates exclusively in Indian Rupees (₹ INR).
Never state legal or tax claims as absolute facts; frame them as practical informal tips.

Return VALID JSON ONLY with this schema:
{{
  "topic": "{query}",
  "idea_summary": "2 sentences explaining the micro-business concept and local demand in Indian neighborhoods.",
  "target_customers": "Who will buy this service/product (working couples, students, apartment residents, etc.)",
  "pricing_strategy": "Concrete pricing in ₹ INR (e.g. ₹300-₹500 per jar/session/hour with batch discounts)",
  "marketing_and_outreach": "Practical zero-cost local marketing (WhatsApp society groups, sample tasting, word-of-mouth)",
  "first_three_steps": [
    "Step 1: Specific first action",
    "Step 2: Specific second action",
    "Step 3: Specific third action"
  ],
  "packaging_and_hygiene": "Hygiene, glass jar packaging, airtight seal, or home setup best practices."
}}"""
            text = call_gemini_with_fallback(client, prompt)
            if text:
                clean_json = text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                parsed["success"] = True
                parsed["ai_available"] = True
                parsed["disclaimer"] = "Practical guidance for informal home businesses in India. Not legal or tax advice."
                return parsed
        except Exception as e:
            logger.warning(f"Gemini API call failed for business guidance: {e}")

    # Deterministic Fallback Guidance
    q_lower = query.lower()
    if "pickle" in q_lower or "papad" in q_lower or "food" in q_lower or "tiffin" in q_lower:
        return {
            "success": True,
            "ai_available": False,
            "topic": query,
            "idea_summary": "Starting a traditional homemade pickle or daily tiffin service caters to high demand for preservative-free, nostalgic homestyle food among busy urban families.",
            "target_customers": "Working professionals, nuclear families in your apartment society, college students missing home-cooked food, and elderly neighbors.",
            "pricing_strategy": "₹250 - ₹350 per 500g glass jar for specialty pickles; ₹150 - ₹220 per daily lunch tiffin meal.",
            "marketing_and_outreach": "Share 50g small tasting samples with immediate neighbors and post an introduction on your building's WhatsApp society group.",
            "first_three_steps": [
                "Step 1: Standardize 2-3 signature family recipes with precise ingredient measurements.",
                "Step 2: Procure sterilized food-grade glass jars and write handwritten ingredient labels with expiry date.",
                "Step 3: Create your SilverHands listing with ₹ INR batch pricing and invite initial customer reviews."
            ],
            "packaging_and_hygiene": "Use sterilized dry glass jars, maintain airtight mustard oil seals, wear clean aprons and headcaps during preparation.",
            "disclaimer": "Practical guidance for informal home businesses in India. Not legal or tax advice."
        }
    elif "tailor" in q_lower or "sew" in q_lower or "blouse" in q_lower or "dress" in q_lower:
        return {
            "success": True,
            "ai_available": False,
            "topic": query,
            "idea_summary": "Offering home saree blouse stitching, dress fitting, and custom alterations provides convenient, high-trust tailoring right in your residential locality.",
            "target_customers": "Working women, wedding party attendees, and college students needing urgent dress modifications and custom saree blouses.",
            "pricing_strategy": "₹350 - ₹600 for standard saree blouse stitching; ₹100 - ₹200 for alterations and fall/pico work.",
            "marketing_and_outreach": "Word-of-mouth through neighborhood ladies' kitty parties, festival gatherings, and local building notices.",
            "first_three_steps": [
                "Step 1: Set up a well-lit, tidy fitting corner with a mirror and measuring tape at home.",
                "Step 2: Prepare a sample photo lookbook of your previous stitching and embroidery patterns.",
                "Step 3: Publish your SilverHands profile with clear delivery timelines (e.g. 48-hour express service)."
            ],
            "packaging_and_hygiene": "Deliver ironed garments in clean fabric or paper garment covers with spare matching thread/buttons.",
            "disclaimer": "Practical guidance for informal home businesses in India. Not legal or tax advice."
        }
    else:
        return {
            "success": True,
            "ai_available": False,
            "topic": query,
            "idea_summary": "Leveraging your lifelong expertise to provide personalized teaching, mentoring, or consultation helps young students and neighbors in your locality.",
            "target_customers": "School students needing patient tuition, young professionals seeking career guidance, and hobby learners.",
            "pricing_strategy": "₹300 - ₹600 per 1-hour session or ₹3,000 - ₹5,000 for a monthly 12-session package.",
            "marketing_and_outreach": "Spread the word through resident associations, parent groups, and community center notice boards.",
            "first_three_steps": [
                "Step 1: Define your core curriculum or mentoring topics with a simple session-by-session outline.",
                "Step 2: Offer a free 20-minute introductory discovery session to understand the learner's goals.",
                "Step 3: List your service on SilverHands and schedule comfortable morning or weekend slots."
            ],
            "packaging_and_hygiene": "Provide printed summary notes or WhatsApp follow-up points after each learning session.",
            "disclaimer": "Practical guidance for informal home businesses in India. Not legal or tax advice."
        }


def generate_senior_mentor_response(message: str, user_context: str = "senior_provider", language: str = "en") -> Dict[str, Any]:
    """
    4. SeniorBot Mentor Chat Agent:
    Provides warm, respectful, plain-language answers for informal Indian micro-businesses (pricing in ₹ INR, safety, customer tips).
    Supports English, Tamil, and Hindi directly based on user's query and selected language.
    """
    client = get_genai_client()
    if client:
        try:
            lang_instruction = ""
            if language == "ta" or any("\u0b80" <= c <= "\u0bff" for c in message):
                lang_instruction = "Respond in simple, warm Tamil (தமிழ்) with English terms where natural."
            elif language == "hi" or any("\u0900" <= c <= "\u097f" for c in message):
                lang_instruction = "Respond in simple, respectful Hindi (हिन्दी) with English terms where natural."
            else:
                lang_instruction = "Respond in warm, clear, plain English."

            system_prompt = f"""You are 'SilverBot', a warm, encouraging, practical business and livelihood mentor for senior citizens and homemakers in India.
Platform: SilverHands ("Turning Lifelong Skills Into New Opportunities").
{lang_instruction}
Provide clear, respectful guidance for informal home businesses in India (tiffin, pickles, tuition, tailoring, gardening, consulting).
Always mention pricing in Indian Rupees (₹ INR). Never state legal or tax claims as absolute facts. Keep replies under 120 words."""
            
            text = call_gemini_with_fallback(client, f"{system_prompt}\n\nUser Question: {message}")
            if text:
                return {
                    "ai_available": True,
                    "reply": text,
                    "suggested_actions": [
                        "Recommended hourly rates in ₹ INR",
                        "Safety tips for home tiffin & visits",
                        "How to ask for a 5-star review"
                    ]
                }
        except Exception as e:
            logger.warning(f"Gemini API call failed for mentor bot: {e}")

    # Fallback Business & Platform Guidance
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["price", "rate", "charge", "rupee", "inr", "cost"]):
        reply = "Namaste! Setting your pricing on SilverHands is straightforward. In India, most senior providers start between ₹250 and ₹500 per hour depending on skill and material costs. As you gain happy local clients and 5-star reviews, you can adjust your rates!"
        actions = ["View typical rates in ₹ INR", "How to calculate batch pricing", "Offering monthly packages"]
    elif any(w in msg_lower for w in ["safety", "visit", "home", "trust"]):
        reply = "Your safety and comfort are paramount. Always verify booking requests on SilverHands before hosting or visiting. For your initial meeting, consider having a family member present or meeting in a well-known local neighborhood spot."
        actions = ["Check verification badge status", "Share visit details with family", "Emergency contacts"]
    else:
        reply = "Namaste! I am SilverBot, your dedicated mentor. Whether you are offering home tiffin, saree tailoring, or student tutoring in your area, I am here to help you turn lifelong skills into new opportunities."
        actions = ["Build profile with AI", "Browse local requests", "Upload profile picture"]

    return {
        "ai_available": False,
        "ai_message": "AI assistance is temporarily unavailable.",
        "reply": reply,
        "suggested_actions": actions
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
    """
    5. Match Explanation Agent:
    Gemini only EXPLAINS an already-computed deterministic match score.
    Returns short, friendly 2-sentence rationale in plain English. Catches errors gracefully.
    """
    client = get_genai_client()
    if client:
        try:
            prompt = f"""Customer query: "{customer_query}".
Senior provider: "{provider_name}" offering "{service_title}" ({category}).
Distance: {distance_km} km, Pre-computed Match Score: {match_score}/100, Experience: {years_experience} years, Rating: {rating}/5.
Write exactly 2 warm, honest, concise sentences explaining why this senior provider in India is a great fit."""
            
            text = call_gemini_with_fallback(client, prompt)
            if text:
                return text
        except Exception as e:
            logger.warning(f"Gemini API call failed for match explanation: {e}")

    return f"{provider_name} brings over {years_experience} years of authentic expertise in {category.lower()} and is located just {distance_km} km away with an outstanding {rating}★ rating."
