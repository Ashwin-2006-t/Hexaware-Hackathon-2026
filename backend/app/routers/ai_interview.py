import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.domain import (
    User, ProviderProfile, Skill, Service, Notification,
    AIInterviewSession, AIInterviewMessage, AIInterviewResult
)
from app.schemas.domain import (
    AIInterviewStartRequest, AIInterviewAnswerRequest, AIInterviewApproveRequest,
    AIInterviewSessionResponse, AIInterviewMessageResponse, AIInterviewResultResponse
)
from app.agents.interview_agent import (
    generate_opening_question, evaluate_answer_and_next_question, generate_final_interview_result
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/v1/ai/interview", tags=["AI Skill Interview Room"])

def _format_session_response(
    session: AIInterviewSession,
    next_question: Optional[str] = None,
    is_completed_ready: bool = False
) -> AIInterviewSessionResponse:
    messages_res = [
        AIInterviewMessageResponse(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            message=m.message,
            input_type=m.input_type,
            question_number=m.question_number,
            created_at=m.created_at
        ) for m in session.messages
    ]

    result_res = None
    if session.result:
        result_res = AIInterviewResultResponse(
            id=session.result.id,
            session_id=session.result.session_id,
            detected_skills=session.result.detected_skills,
            experience_summary=session.result.experience_summary,
            capabilities=session.result.capabilities,
            confidence_score=session.result.confidence_score,
            suggested_services=session.result.suggested_services,
            evidence=session.result.evidence,
            recommendation_reason=session.result.recommendation_reason,
            created_at=session.result.created_at
        )

    return AIInterviewSessionResponse(
        id=session.id,
        senior_id=session.senior_id,
        session_type=session.session_type or "REGISTRATION",
        language=session.language or "en",
        selected_domain=session.selected_domain,
        selected_skill=session.selected_skill,
        existing_profile_snapshot=session.existing_profile_snapshot,
        status=session.status,
        started_at=session.started_at,
        completed_at=session.completed_at,
        overall_score=session.overall_score,
        summary=session.summary,
        messages=messages_res,
        result=result_res,
        next_question=next_question,
        is_completed_ready=is_completed_ready
    )

# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@router.post("/start", response_model=AIInterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def start_interview(
    payload: AIInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Starts a new AI Skill Interview for Registration Onboarding or Existing Profile Update.
    Loads existing profile snapshot if updating, generates initial AI question in target language.
    """
    if current_user.role.upper() != "SENIOR" and current_user.role.upper() != "PROVIDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only senior service providers can participate in AI skill interviews."
        )

    session_type = (payload.session_type or "REGISTRATION").upper()
    language = payload.language or "en"
    existing_snapshot = None

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if profile:
        snap_dict = {
            "title": profile.title,
            "bio": profile.bio,
            "skills": [{"name": s.name, "category": s.category} for s in profile.skills],
            "services": [{"name": s.name, "category": s.category, "description": s.description} for s in profile.services],
            "location": current_user.location or "Chennai, Tamil Nadu"
        }
        existing_snapshot = json.dumps(snap_dict)

    session = AIInterviewSession(
        senior_id=current_user.id,
        session_type=session_type,
        language=language,
        selected_domain=payload.selected_domain.strip(),
        selected_skill=payload.selected_skill.strip(),
        existing_profile_snapshot=existing_snapshot,
        status="IN_PROGRESS"
    )
    db.add(session)
    db.flush()

    opening_question = generate_opening_question(
        domain=payload.selected_domain,
        skill=payload.selected_skill,
        language=language,
        session_type=session_type,
        existing_profile_snapshot=existing_snapshot
    )

    first_msg = AIInterviewMessage(
        session_id=session.id,
        role="AI",
        message=opening_question,
        input_type="TEXT",
        question_number=1
    )
    db.add(first_msg)
    db.commit()
    db.refresh(session)

    return _format_session_response(session, next_question=opening_question)

@router.post("/{session_id}/answer", response_model=AIInterviewSessionResponse)
def submit_answer(
    session_id: str,
    payload: AIInterviewAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a senior's text or voice answer.
    Evaluates conversation context via Gemini and generates next dynamic follow-up question.
    """
    session = db.query(AIInterviewSession).filter(AIInterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.senior_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to interview session.")

    if session.status == "COMPLETED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview session is already completed.")

    current_q_num = sum(1 for m in session.messages if m.role == "AI")

    # Persist senior answer
    senior_msg = AIInterviewMessage(
        session_id=session.id,
        role="SENIOR",
        message=payload.answer.strip(),
        input_type=payload.input_type.upper() if payload.input_type else "TEXT",
        question_number=current_q_num
    )
    db.add(senior_msg)
    db.commit()
    db.refresh(session)

    # Format history for agent evaluation
    history = [{"role": m.role, "message": m.message} for m in session.messages]

    next_needed, next_text = evaluate_answer_and_next_question(
        domain=session.selected_domain,
        skill=session.selected_skill,
        history=history,
        language=session.language or "en",
        session_type=session.session_type or "REGISTRATION"
    )

    if next_needed and next_text:
        ai_msg = AIInterviewMessage(
            session_id=session.id,
            role="AI",
            message=next_text,
            input_type="TEXT",
            question_number=current_q_num + 1
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(session)
        return _format_session_response(session, next_question=next_text, is_completed_ready=False)
    else:
        return _format_session_response(session, next_question=None, is_completed_ready=True)

@router.post("/{session_id}/complete", response_model=AIInterviewSessionResponse)
def complete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Completes interview, synthesizes structured JSON results, runs profile comparison classifier.
    """
    session = db.query(AIInterviewSession).filter(AIInterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.senior_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to interview session.")

    if session.result:
        return _format_session_response(session, is_completed_ready=True)

    history = [{"role": m.role, "message": m.message} for m in session.messages]
    result_data = generate_final_interview_result(
        domain=session.selected_domain,
        skill=session.selected_skill,
        history=history,
        language=session.language or "en",
        session_type=session.session_type or "REGISTRATION",
        existing_profile_snapshot=session.existing_profile_snapshot
    )

    res_record = AIInterviewResult(
        session_id=session.id,
        detected_skills=json.dumps(result_data.get("detected_skills", result_data.get("skills", []))),
        experience_summary=result_data.get("experience_summary", ""),
        capabilities=json.dumps(result_data.get("capabilities", [])),
        confidence_score=result_data.get("confidence_score", 90),
        suggested_services=json.dumps(result_data.get("suggested_services", [])),
        evidence=result_data.get("evidence", ""),
        recommendation_reason=result_data.get("recommendation_reason", "")
    )
    db.add(res_record)

    session.status = "COMPLETED"
    session.completed_at = datetime.datetime.utcnow()
    session.overall_score = result_data.get("confidence_score", 90)
    session.summary = result_data.get("experience_summary", "")

    db.commit()
    db.refresh(session)

    # In-App Notification
    try:
        NotificationService.notify_user(
            db=db,
            user_id=current_user.id,
            notification_type="AI_INTERVIEW_READY",
            title="Your AI Skill Profile is Ready",
            message=f"Your AI interview for {session.selected_skill} is complete. Review and approve your skills to update your profile."
        )
    except Exception as e:
        print(f"[AIInterview] Notification warning: {e}")

    return _format_session_response(session, is_completed_ready=True)

@router.get("/my-interviews", response_model=List[AIInterviewSessionResponse])
def get_my_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all AI interview sessions for authenticated senior."""
    sessions = db.query(AIInterviewSession).filter(
        AIInterviewSession.senior_id == current_user.id
    ).order_by(AIInterviewSession.created_at.desc()).all()

    return [_format_session_response(s) for s in sessions]

@router.get("/{session_id}", response_model=AIInterviewSessionResponse)
def get_interview_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves specific AI interview session by ID."""
    session = db.query(AIInterviewSession).filter(AIInterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.senior_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to interview session.")

    return _format_session_response(session)

@router.post("/{session_id}/approve-profile")
def approve_and_save_profile(
    session_id: str,
    payload: AIInterviewApproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Senior reviews and approves generated skills/services before permanently saving to SQLite.
    Updates skills, services, bio, experience_years, sets profile_setup_completed = True.
    Integrates with the Opportunity Recommendation Engine.
    """
    session = db.query(AIInterviewSession).filter(AIInterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.senior_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to interview session.")

    current_user.profile_setup_completed = True

    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        profile = ProviderProfile(
            user_id=current_user.id,
            title=f"Senior {session.selected_domain} Specialist",
            bio=payload.bio_summary or f"Experienced specialist in {session.selected_skill}.",
            status="PUBLISHED",
            availability="Available"
        )
        db.add(profile)
        db.flush()

    # 1. Update Approved Skills (Prevent duplicates)
    existing_skills = {s.name.strip().lower() for s in profile.skills}
    added_skills_count = 0
    for sk_name in payload.approved_skills:
        name_clean = sk_name.strip()
        if name_clean and name_clean.lower() not in existing_skills:
            db.add(Skill(provider_id=profile.id, name=name_clean, category=session.selected_domain, proficiency="Expert"))
            existing_skills.add(name_clean.lower())
            added_skills_count += 1

    # 2. Update Approved Services
    existing_services = {srv.name.strip().lower() for srv in profile.services}
    added_services_count = 0
    for srv_item in payload.approved_services:
        srv_clean = srv_item.name.strip()
        if srv_clean and srv_clean.lower() not in existing_services:
            db.add(Service(
                provider_id=profile.id,
                name=srv_clean,
                description=srv_item.description or f"Professional {srv_clean.lower()} service.",
                category=srv_item.category or session.selected_domain,
                price_range=srv_item.price_range or "Negotiable"
            ))
            existing_services.add(srv_clean.lower())
            added_services_count += 1

    # 3. Update Experience Years & Bio if provided
    if payload.experience_years is not None and payload.experience_years > 0:
        profile.experience_years = max(profile.experience_years or 0, payload.experience_years)

    if payload.bio_summary:
        if not profile.bio:
            profile.bio = payload.bio_summary
        elif payload.bio_summary not in profile.bio:
            profile.bio = f"{profile.bio}\n\nAI Verified Experience: {payload.bio_summary}"

    db.commit()

    # In-App Notification
    try:
        NotificationService.notify_user(
            db=db,
            user_id=current_user.id,
            notification_type="PROFILE_UPDATED",
            title="Skill Profile Updated",
            message=f"Added {added_skills_count} new skill(s) and {added_services_count} new service(s) from your AI interview to your profile."
        )
    except Exception as e:
        print(f"[AIInterview] Profile update notification warning: {e}")

    return {
        "success": True,
        "message": f"Successfully updated profile with {added_skills_count} skill(s) and {added_services_count} service(s).",
        "provider_id": profile.id,
        "added_skills": added_skills_count,
        "added_services": added_services_count
    }
