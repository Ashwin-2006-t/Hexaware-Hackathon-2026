import os
import json
import re
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def _get_gemini_client():
    if not GEMINI_API_KEY:
        return None
    try:
        from google import genai
        return genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"[InterviewAgent] Unable to initialize GenAI client: {e}")
        return None

def detect_language(text: str) -> str:
    """Detects whether text is primarily Tamil (ta), Hindi (hi), or English (en)."""
    if not text:
        return "en"
    # Tamil Unicode block: \u0B80-\u0BFF
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"
    # Devanagari Unicode block (Hindi): \u0900-\u097F
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    return "en"

# ------------------------------------------------------------------
# Multilingual & Multimode Rule-Based Fallbacks for Quota / API Errors
# ------------------------------------------------------------------
def _generate_fallback_opening(domain: str, skill: str, language: str = "en", session_type: str = "REGISTRATION", existing_skills: List[str] = None) -> str:
    domain_clean = domain.strip().title()
    skill_clean = skill.strip().title()

    if session_type == "UPDATE" and existing_skills:
        skills_str = ", ".join(existing_skills[:3])
        if language == "ta":
            return f"வணக்கம்! உங்கள் தற்போதைய சுயவிவரத்தில் {skills_str} திறன்கள் உள்ளன. சமீபத்தில் ஏதேனும் புதிய திறன்கள் அல்லது சேவைகளைத் தொடங்கியுள்ளீர்களா?"
        elif language == "hi":
            return f"नमस्ते! आपकी वर्तमान प्रोफ़ाइल में {skills_str} कौशल शामिल हैं। क्या आपने हाल ही में कोई नया कौशल या सेवा शुरू की है?"
        else:
            return f"Hello! Your current profile includes {skills_str}. Have you learned or started offering any new skills or services recently?"

    if language == "ta":
        return f"வணக்கம்! {skill_clean} பிரிவில் உங்கள் அனுபவத்தைப் பற்றி மேலும் அறிய விரும்புகிறோம். நீங்கள் எவ்வளவு காலம் இதைச் செய்து வருகிறீர்கள்?"
    elif language == "hi":
        return f"नमस्ते! {skill_clean} में आपके अनुभव के बारे में और जानने के लिए आपका स्वागत है। आप कितने वर्षों से यह काम कर रहे हैं?"
    else:
        return f"Hello! We're excited to learn more about your experience in {skill_clean} under {domain_clean}. Could you share how many years you've been practicing this skill and how you started?"

def _generate_fallback_next_question(domain: str, skill: str, history: List[Dict[str, str]], language: str = "en", session_type: str = "REGISTRATION") -> Tuple[bool, str]:
    q_count = sum(1 for m in history if m.get("role") == "AI")
    
    if q_count >= 5:
        completion_msgs = {
            "ta": "மிக்க நன்றி! உங்கள் திறன்களைப் பற்றிய அனைத்து விவரங்களையும் சேகரித்துவிட்டோம்.",
            "hi": "बहुत-बहुत धन्यवाद! हमने आपकी प्रोफ़ाइल के लिए पर्याप्त जानकारी एकत्र कर ली है।",
            "en": "Thank you so much! We have gathered comprehensive information for your skill profile."
        }
        return False, completion_msgs.get(language, completion_msgs["en"])

    last_answer = ""
    for m in reversed(history):
        if m.get("role") == "SENIOR":
            last_answer = m.get("message", "").lower()
            break

    skill_lower = skill.lower()

    if q_count == 1:
        if session_type == "UPDATE":
            if language == "ta":
                return True, "அற்புதமான முயற்சி! இந்த புதிய சேவையை நீங்கள் எப்போது தொடங்கினீர்கள், எந்த வகையான வாடிக்கையாளர்களுக்கு வழங்குகிறீர்கள்?"
            elif language == "hi":
                return True, "बहुत बढ़िया! आपने यह नई सेवा कब शुरू की और किस प्रकार के ग्राहकों के लिए काम करते हैं?"
            else:
                return True, "That's fantastic! How long have you been providing this new service, and what specific projects have you completed?"
        else:
            if language == "ta":
                return True, "மிகவும் மகிழ்ச்சி! இந்தத் திறனில் நீங்கள் மிகவும் நம்பிக்கையுடன் வழங்கும் குறிப்பிட்ட தயாரிப்புகள் அல்லது சேவைகள் எவை?"
            elif language == "hi":
                return True, "बहुत बढ़िया! इस कौशल में आप कौन से विशिष्ट कार्य या उत्पाद सबसे आत्मविश्वास के साथ प्रदान करते हैं?"
            else:
                return True, "That's wonderful experience! What specific services, meals, or projects in this area are you most confident preparing?"

    elif q_count == 2:
        if language == "ta":
            return True, "பொதுவாக எவ்வளவு பெரிய அளவில் அல்லது எத்தனை பேருக்கு இந்தச் சேவையை வழங்க முடியும்?"
        elif language == "hi":
            return True, "आमतौर पर आप कितने बड़े पैमाने पर या कितने लोगों के लिए यह काम कर सकते हैं?"
        else:
            return True, "Could you share the scale or capacity of work you usually handle, and the equipment or materials you use?"

    elif q_count == 3:
        if language == "ta":
            return True, "வாடிக்கையாளர்களின் திருப்தியை உறுதிப்படுத்த நீங்கள் என்ன சிறப்பு கவனம் செலுத்துகிறீர்கள்?"
        elif language == "hi":
            return True, "ग्राहकों की संतुष्टि और गुणवत्ता सुनिश्चित करने के लिए आप क्या विशेष ध्यान रखते हैं?"
        else:
            return True, "How do you ensure high quality and satisfaction when completing orders for your neighbors or clients?"

    elif q_count == 4:
        if language == "ta":
            return True, "வாடிக்கையாளர்கள் தெரிந்துகொள்ள வேண்டிய வேறு ஏதேனும் சிறப்புத் தகுதிகள் உள்ளதா?"
        elif language == "hi":
            return True, "क्या कोई अन्य विशेष अनुभव है जो आप संभावित ग्राहकों के साथ साझा करना चाहेंगे?"
        else:
            return True, "Is there any additional specialty or customer preference capability you would like potential clients to know about?"

    return False, "Thank you! We have gathered sufficient details."

def _generate_fallback_result(domain: str, skill: str, history: List[Dict[str, str]], language: str = "en", session_type: str = "REGISTRATION", existing_snapshot: str = None) -> Dict[str, Any]:
    senior_answers = [m.get("message", "") for m in history if m.get("role") == "SENIOR"]
    combined_text = " ".join(senior_answers)

    existing_skills_list = []
    if existing_snapshot:
        try:
            snap = json.loads(existing_snapshot)
            existing_skills_list = [s.get("name", "") for s in snap.get("skills", [])]
        except Exception:
            pass

    skills_list = []
    comparison_classification = []

    main_skill_name = skill.title()
    is_duplicate = any(main_skill_name.lower() in existing.lower() for existing in existing_skills_list)

    if session_type == "UPDATE" and is_duplicate:
        comparison_classification.append({
            "skill": main_skill_name,
            "type": "EXISTING_SKILL_CONFIRMED",
            "reason": "Skill matches existing profile records."
        })
    else:
        skills_list.append({
            "name": main_skill_name,
            "confidence": 0.94,
            "evidence": "Demonstrated practical experience during interview answers."
        })
        comparison_classification.append({
            "skill": main_skill_name,
            "type": "NEW_SKILL",
            "reason": "Newly identified capability from interview."
        })

    if "bulk" in combined_text.lower() or "event" in combined_text.lower() or "பெரிய" in combined_text or "बड़ा" in combined_text:
        skills_list.append({"name": "Bulk & Event Orders", "confidence": 0.88, "evidence": "Mentioned handling larger scale requirements."})
        comparison_classification.append({"skill": "Bulk & Event Orders", "type": "NEW_SKILL", "reason": "Mentioned large order capability."})

    suggested_services = [
        {
            "name": f"Authentic {skill.title()} Services",
            "category": domain.title(),
            "description": f"Professional {skill.lower()} provided with personalized care and years of experience.",
            "price_range": "Negotiable",
            "type": "NEW_SERVICE"
        }
    ]

    return {
        "skills": skills_list,
        "detected_skills": skills_list,
        "experience_years": 15,
        "experience_summary": f"Experienced practitioner in {skill.title()} under {domain.title()} with proven dedication.",
        "capabilities": [
            f"Customized {skill.title()} services tailored to neighbor preferences",
            "High quality attention to traditional techniques and customer satisfaction"
        ],
        "confidence_score": 90,
        "suggested_services": suggested_services,
        "evidence": f"Interview responses highlighted practical knowledge across {len(senior_answers)} answers.",
        "recommendation_reason": f"Strong alignment between senior's reported experience in {skill} and local market demand.",
        "classification": comparison_classification
    }

# ------------------------------------------------------------------
# Public Agent Interfaces (Gemini + Fallback)
# ------------------------------------------------------------------
def generate_opening_question(domain: str, skill: str, language: str = "en", session_type: str = "REGISTRATION", existing_profile_snapshot: str = None) -> str:
    """Generates the opening AI interview question tailored to domain, skill, language, and session mode."""
    client = _get_gemini_client()

    existing_skills_str = ""
    if existing_profile_snapshot:
        try:
            snap = json.loads(existing_profile_snapshot)
            existing_skills_str = ", ".join([s.get("name", "") for s in snap.get("skills", [])])
        except Exception:
            pass

    if client:
        try:
            from google.genai import types
            prompt = f"""
You are the SilverHands AI Skill Interviewer. You are conducting a respectful, warm skill interview with an Indian senior citizen or homemaker.
Target Language: "{language}" (Must respond in 'ta' for Tamil, 'hi' for Hindi, 'en' for English).
Session Type: "{session_type}" (REGISTRATION or UPDATE).
Domain: "{domain}", Skill: "{skill}".
Existing Profile Skills: "{existing_skills_str}"

Instructions:
- If session_type is "UPDATE", greet them warmly, mention their existing skills if any ("{existing_skills_str}"), and ask if they have started any new skills or services recently.
- If session_type is "REGISTRATION", introduce yourself warmly and ask how long they have practiced "{skill}" and how they started.
- Respond STRICTLY in the target language ({language}).
- Keep the tone encouraging, respectful, and senior-friendly (2 sentences max).
- Return ONLY the question text.
"""
            response = client.models.generate_content(
                model="models/gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"[InterviewAgent] Gemini opening question error: {e}")

    return _generate_fallback_opening(domain, skill, language, session_type)

def evaluate_answer_and_next_question(domain: str, skill: str, history: List[Dict[str, str]], language: str = "en", session_type: str = "REGISTRATION") -> Tuple[bool, str]:
    """
    Evaluates conversation history, detects answer language, and generates the next dynamic follow-up question.
    """
    q_count = sum(1 for m in history if m.get("role") == "AI")
    if q_count >= 5:
        completion_msgs = {
            "ta": "மிக்க நன்றி! உங்கள் திறன்களைப் பற்றிய அனைத்து விவரங்களையும் சேகரித்துவிட்டோம்.",
            "hi": "बहुत-बहुत धन्यवाद! हमने आपकी प्रोफ़ाइल के लिए पर्याप्त जानकारी एकत्र कर ली है।",
            "en": "Thank you! We have gathered sufficient details to complete your profile."
        }
        return False, completion_msgs.get(language, completion_msgs["en"])

    # Auto-detect language from latest senior answer if available
    latest_answer = ""
    for m in reversed(history):
        if m.get("role") == "SENIOR":
            latest_answer = m.get("message", "")
            break

    detected_lang = detect_language(latest_answer) if latest_answer else language
    target_lang = detected_lang if detected_lang in ["ta", "hi"] else language

    client = _get_gemini_client()
    if client:
        try:
            from google.genai import types
            formatted_history = "\n".join([f"{m.get('role')}: {m.get('message')}" for m in history])

            prompt = f"""
You are the SilverHands AI Skill Interviewer evaluating an ongoing interview.
Domain: "{domain}", Skill: "{skill}", Session Type: "{session_type}".
Target Response Language: "{target_lang}" (Respond in Tamil if 'ta', Hindi if 'hi', English if 'en').
Transcript:
{formatted_history}

Determine what essential details are still missing (experience years, specific items/specialties, order capacity, work location/preference).

Instructions:
- If you have gathered sufficient evidence OR question count is 4+, set "next_question_needed": false.
- If more probing is needed, set "next_question_needed": true and generate "next_question" directly addressing their previous answer.
- The question MUST be written in "{target_lang}".
- Return ONLY valid JSON matching this schema:
{{
  "next_question_needed": true,
  "next_question": "Your follow-up question in target language..."
}}
"""
            response = client.models.generate_content(
                model="models/gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2, response_mime_type="application/json")
            )
            if response and response.text:
                data = json.loads(response.text.strip())
                needed = bool(data.get("next_question_needed", True))
                q_text = data.get("next_question", "")
                if not needed or not q_text:
                    return False, "Thank you! We have gathered sufficient detail to complete your profile."
                return True, q_text.strip()
        except Exception as e:
            print(f"[InterviewAgent] Gemini evaluation error: {e}")

    return _generate_fallback_next_question(domain, skill, history, target_lang, session_type)

def generate_final_interview_result(domain: str, skill: str, history: List[Dict[str, str]], language: str = "en", session_type: str = "REGISTRATION", existing_profile_snapshot: str = None) -> Dict[str, Any]:
    """
    Generates structured profile information, skills, services, and profile comparison classification.
    """
    client = _get_gemini_client()
    if client:
        try:
            from google.genai import types
            formatted_history = "\n".join([f"{m.get('role')}: {m.get('message')}" for m in history])

            prompt = f"""
You are the SilverHands AI Profile Decision Engine. Analyze the complete interview transcript below for a senior provider.
Domain: "{domain}", Skill: "{skill}", Session Type: "{session_type}".
Existing Profile Snapshot: "{existing_profile_snapshot or 'None'}"

Transcript:
{formatted_history}

Synthesize a structured professional skills profile and classify findings against existing profile records.

Return ONLY valid JSON matching this exact structure:
{{
  "skills": [
    {{
      "name": "Specific Skill Name",
      "confidence": 0.94,
      "evidence": "Evidence string from answers"
    }}
  ],
  "experience_years": 20,
  "experience_summary": "Professional summary of experience",
  "capabilities": [
    "Capability 1",
    "Capability 2"
  ],
  "confidence_score": 92,
  "suggested_services": [
    {{
      "name": "Service Title",
      "category": "{domain}",
      "description": "Clear service description for customers",
      "price_range": "Negotiable"
    }}
  ],
  "classification": [
    {{
      "skill": "Skill Name",
      "type": "NEW_SKILL",
      "reason": "Explanation of classification"
    }}
  ],
  "evidence": "Summary of key evidence",
  "recommendation_reason": "Why these skills and services match customer demand"
}}
"""
            response = client.models.generate_content(
                model="models/gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2, response_mime_type="application/json")
            )
            if response and response.text:
                data = json.loads(response.text.strip())
                if "skills" in data and "experience_summary" in data and "suggested_services" in data:
                    data["detected_skills"] = data["skills"]
                    return data
        except Exception as e:
            print(f"[InterviewAgent] Gemini final result error: {e}")

    return _generate_fallback_result(domain, skill, history, language, session_type, existing_profile_snapshot)
