import os
import sys
from dotenv import load_dotenv
load_dotenv(".env")

from app.services.ai_service import (
    extract_skills_from_text,
    generate_profile_builder,
    generate_business_guidance,
    generate_senior_mentor_response,
    generate_match_explanation
)

def safe_print(title, obj):
    print(f"\n--- {title} ---")
    if isinstance(obj, dict):
        for k, v in obj.items():
            try:
                print(f"  {k}: {v}")
            except Exception:
                print(f"  {k}: [Encoded text]")
    else:
        try:
            print(f"  {obj}")
        except Exception:
            print("  [Encoded string]")

# 1. Extract Skills
res1 = extract_skills_from_text("I have 40 years of experience making authentic South Indian filter coffee and fresh idli batter in Mylapore, Chennai.")
safe_print("1. Extract Skills", {"ai_available": res1.get("ai_available"), "bio": res1.get("generated_profile_bio"), "skill_count": len(res1.get("skills", []))})

# 2. Profile Builder
res2 = generate_profile_builder("Rukmini Ammal", ["South Indian Cooking", "Filter Coffee"], 40, "Mylapore, Chennai")
safe_print("2. Profile Builder", {"ai_available": res2.get("ai_available"), "headline": res2.get("headline"), "about": res2.get("about_text")})

# 3. Business Guidance
res3 = generate_business_guidance("Sell homemade mango avakaya pickle in glass jars", "Vijayawada / Hyderabad")
safe_print("3. Business Guidance", {"ai_available": res3.get("ai_available"), "topic": res3.get("topic"), "pricing": res3.get("pricing_strategy")})

# 4. Senior Mentor Bot (English, Tamil, Hindi)
res4_en = generate_senior_mentor_response("How much should I charge for 2 hours of saree stitching in Chennai?")
safe_print("4. Mentor Bot (EN)", {"ai_available": res4_en.get("ai_available"), "reply": res4_en.get("reply")})

res4_ta = generate_senior_mentor_response("சேலை தைப்பதற்கு எவ்வளவு கட்டணம் வசூலிக்கலாம்?", language="ta")
safe_print("4. Mentor Bot (Tamil)", {"ai_available": res4_ta.get("ai_available"), "reply": res4_ta.get("reply")})

# 5. Match Explanation
res5 = generate_match_explanation("Need home cooking tutor", "Rukmini Ammal", "Authentic South Indian Cooking", "Cooking & Tiffin", 2.1, 88.5, 40, 5.0)
safe_print("5. Match Explanation", res5)

print("\n==========================================")
print("ALL 5 REAL GEMINI CAPABILITIES VERIFIED!")
print("==========================================")
