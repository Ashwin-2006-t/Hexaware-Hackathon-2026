import uuid
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.db.session import get_db
from app.models.domain import (
    User, FamilyRelationship, FamilyPermission, FamilyInvitation,
    Booking, ServiceListing, Notification
)
from app.schemas.domain import (
    FamilyMemberResponse, FamilyPermissionItem, FamilyPermissionUpdateRequest,
    FamilyInviteCreate, FamilyInviteResponse, FamilyInvitationDetailResponse,
    ConnectedSeniorResponse, SeniorDashboardForFamilyResponse, BookingResponse
)
from app.api.deps import get_current_user

router = APIRouter()

STANDARD_PERMISSIONS = [
    {
        "key": "VIEW_BOOKINGS",
        "label": "View Upcoming & Completed Bookings",
        "description": "Family member can view scheduled dates, times, and service status."
    },
    {
        "key": "VIEW_SERVICE_DETAILS",
        "label": "View Service Listings & Skill Details",
        "description": "Access detailed descriptions of crafts, cooking, and tutoring services."
    },
    {
        "key": "VIEW_PROVIDER_DETAILS",
        "label": "View Provider Identity & Contact Info",
        "description": "View provider background, phone numbers, and neighborhood location."
    },
    {
        "key": "RECEIVE_NOTIFICATIONS",
        "label": "Receive Real-time Family Alerts",
        "description": "Get notified on service confirmations, reminders, and completed jobs."
    },
    {
        "key": "HELP_WITH_REQUESTS",
        "label": "Assist with Video Calls & Service Inquiries",
        "description": "Join virtual pre-service consultations and help senior coordinate requests."
    }
]

DEFAULT_INITIAL_PERMISSIONS = {
    "VIEW_BOOKINGS": True,
    "VIEW_SERVICE_DETAILS": True,
    "VIEW_PROVIDER_DETAILS": True,
    "RECEIVE_NOTIFICATIONS": True,
    "HELP_WITH_REQUESTS": False
}


def build_family_member_response(rel: FamilyRelationship, db: Session) -> FamilyMemberResponse:
    senior = db.query(User).filter(User.id == rel.senior_user_id).first()
    fam = db.query(User).filter(User.id == rel.family_user_id).first()
    
    perms = db.query(FamilyPermission).filter(FamilyPermission.relationship_id == rel.id).all()
    perm_dict = {p.permission: p.enabled for p in perms}

    perm_items: List[FamilyPermissionItem] = []
    for sp in STANDARD_PERMISSIONS:
        perm_items.append(FamilyPermissionItem(
            permission=sp["key"],
            enabled=perm_dict.get(sp["key"], False),
            label=sp["label"],
            description=sp["description"]
        ))

    return FamilyMemberResponse(
        relationship_id=rel.id,
        senior_user_id=rel.senior_user_id,
        senior_name=senior.full_name if senior else "Senior User",
        family_user_id=rel.family_user_id,
        family_name=fam.full_name if fam else "Family Member",
        family_email=fam.email if fam else "",
        family_phone=fam.phone if fam else None,
        relationship_type=rel.relationship_type or "Family Member",
        status=rel.status,
        created_at=rel.created_at.isoformat() if rel.created_at else "",
        accepted_at=rel.accepted_at.isoformat() if rel.accepted_at else None,
        permissions=perm_items
    )


# --- Senior Family Management Endpoints ---

@router.get("/circle", response_model=Dict[str, Any], summary="Get Senior's Family Circle (Members & Invites)")
def get_family_circle(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns active family members and pending invitations for the authenticated senior."""
    relationships = db.query(FamilyRelationship).filter(
        FamilyRelationship.senior_user_id == current_user.id,
        FamilyRelationship.status == "active"
    ).all()

    members = [build_family_member_response(r, db) for r in relationships]

    # Active pending invitations
    invites = db.query(FamilyInvitation).filter(
        FamilyInvitation.senior_user_id == current_user.id,
        FamilyInvitation.status == "pending"
    ).order_by(FamilyInvitation.created_at.desc()).all()

    now = datetime.datetime.utcnow()
    invite_items = []
    for inv in invites:
        is_expired = inv.expires_at < now
        if is_expired and inv.status == "pending":
            inv.status = "expired"
            db.commit()

        invite_items.append({
            "id": inv.id,
            "email_or_phone": inv.email_or_phone,
            "relationship_type": inv.relationship_type,
            "token": inv.token,
            "status": inv.status,
            "invite_url": f"http://localhost:5173/?invite={inv.token}",
            "expires_at": inv.expires_at.isoformat(),
            "created_at": inv.created_at.isoformat(),
            "is_expired": is_expired
        })

    return {
        "senior_user_id": current_user.id,
        "senior_name": current_user.full_name,
        "total_active_members": len(members),
        "members": members,
        "pending_invitations": invite_items,
        "available_permission_types": STANDARD_PERMISSIONS
    }


@router.post("/invite", response_model=FamilyInviteResponse, summary="Invite a Family Member")
def invite_family_member(
    invite_in: FamilyInviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a secure family invitation token.
    Prevents self-invite or duplicate pending invites.
    """
    clean_target = invite_in.email_or_phone.strip().lower()

    if clean_target == current_user.email.lower() or (current_user.phone and clean_target == current_user.phone.strip().lower()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot invite yourself to your own Family Circle."
        )

    # Check if already an active family member
    existing_fam_user = db.query(User).filter(
        (User.email == clean_target) | (User.phone == clean_target)
    ).first()

    if existing_fam_user:
        active_rel = db.query(FamilyRelationship).filter(
            FamilyRelationship.senior_user_id == current_user.id,
            FamilyRelationship.family_user_id == existing_fam_user.id,
            FamilyRelationship.status == "active"
        ).first()
        if active_rel:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{existing_fam_user.full_name} is already an active member in your Family Circle."
            )

    # Check existing pending invite
    existing_invite = db.query(FamilyInvitation).filter(
        FamilyInvitation.senior_user_id == current_user.id,
        FamilyInvitation.email_or_phone == clean_target,
        FamilyInvitation.status == "pending"
    ).first()

    token = f"fam_{uuid.uuid4().hex}"
    expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)

    # Initial permissions serialization
    init_perms = invite_in.permissions if invite_in.permissions else DEFAULT_INITIAL_PERMISSIONS
    perms_str = json.dumps(init_perms)

    if existing_invite:
        # Refresh existing invite token & expiry
        existing_invite.token = token
        existing_invite.relationship_type = invite_in.relationship_type
        existing_invite.initial_permissions = perms_str
        existing_invite.expires_at = expires
        existing_invite.created_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing_invite)
        inv_record = existing_invite
    else:
        inv_record = FamilyInvitation(
            senior_user_id=current_user.id,
            email_or_phone=clean_target,
            relationship_type=invite_in.relationship_type,
            token=token,
            status="pending",
            initial_permissions=perms_str,
            expires_at=expires,
            created_at=datetime.datetime.utcnow()
        )
        db.add(inv_record)
        db.commit()
        db.refresh(inv_record)

    # Add confirmation notification for senior
    try:
        notif = Notification(
            user_id=current_user.id,
            type="family",
            title="Family Circle Invite Sent",
            message=f"Invitation sent to {clean_target} ({invite_in.relationship_type}). They can now join your Family Circle.",
            action="family_circle",
            action_payload=json.dumps({"invite_id": inv_record.id}),
            read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return FamilyInviteResponse(
        id=inv_record.id,
        senior_user_id=current_user.id,
        senior_name=current_user.full_name,
        email_or_phone=inv_record.email_or_phone,
        relationship_type=inv_record.relationship_type,
        token=inv_record.token,
        status=inv_record.status,
        invite_url=f"http://localhost:5173/?invite={inv_record.token}",
        expires_at=inv_record.expires_at.isoformat(),
        created_at=inv_record.created_at.isoformat()
    )


@router.get("/invitations/{token}", response_model=FamilyInvitationDetailResponse, summary="Inspect Family Invitation Details")
def inspect_family_invitation(token: str, db: Session = Depends(get_db)):
    """Inspects an invitation token details before accepting."""
    inv = db.query(FamilyInvitation).filter(FamilyInvitation.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation token not found or invalid.")

    now = datetime.datetime.utcnow()
    is_expired = inv.expires_at < now
    if is_expired and inv.status == "pending":
        inv.status = "expired"
        db.commit()

    senior = db.query(User).filter(User.id == inv.senior_user_id).first()

    return FamilyInvitationDetailResponse(
        token=inv.token,
        senior_user_id=inv.senior_user_id,
        senior_name=senior.full_name if senior else "Senior User",
        senior_location=senior.location_name if senior else None,
        email_or_phone=inv.email_or_phone,
        relationship_type=inv.relationship_type,
        status=inv.status,
        expires_at=inv.expires_at.isoformat(),
        is_expired=is_expired
    )


@router.post("/invitations/{token}/accept", response_model=Dict[str, Any], summary="Accept Family Invitation (Authenticated)")
def accept_family_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Family member explicitly accepts the senior's invitation.
    Transitions status to ACTIVE and provisions initial senior-controlled permissions.
    """
    inv = db.query(FamilyInvitation).filter(FamilyInvitation.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    if inv.status == "accepted":
        raise HTTPException(status_code=400, detail="This invitation has already been accepted.")

    if inv.status == "expired" or inv.expires_at < datetime.datetime.utcnow():
        inv.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="This invitation has expired. Please ask the senior to re-send an invite.")

    # Prevent senior from accepting their own invite
    if inv.senior_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot accept an invitation you created for yourself.")

    # Check if already connected
    existing_rel = db.query(FamilyRelationship).filter(
        FamilyRelationship.senior_user_id == inv.senior_user_id,
        FamilyRelationship.family_user_id == current_user.id,
        FamilyRelationship.status == "active"
    ).first()

    senior = db.query(User).filter(User.id == inv.senior_user_id).first()
    senior_name = senior.full_name if senior else "Senior"

    if existing_rel:
        inv.status = "accepted"
        db.commit()
        return {
            "status": "success",
            "message": f"You are already connected to {senior_name}'s Family Circle.",
            "relationship_id": existing_rel.id,
            "senior_name": senior_name
        }

    # Create relationship record
    now = datetime.datetime.utcnow()
    rel = FamilyRelationship(
        senior_user_id=inv.senior_user_id,
        family_user_id=current_user.id,
        relationship_type=inv.relationship_type or "Family Member",
        status="active",
        created_at=now,
        accepted_at=now
    )
    db.add(rel)
    db.flush()

    # Parse initial permissions
    init_perms_dict = DEFAULT_INITIAL_PERMISSIONS
    if inv.initial_permissions:
        try:
            init_perms_dict = json.loads(inv.initial_permissions)
        except Exception:
            pass

    # Seed permissions
    for sp in STANDARD_PERMISSIONS:
        perm_key = sp["key"]
        enabled = init_perms_dict.get(perm_key, True if perm_key != "HELP_WITH_REQUESTS" else False)
        perm = FamilyPermission(
            relationship_id=rel.id,
            permission=perm_key,
            enabled=enabled
        )
        db.add(perm)

    inv.status = "accepted"
    db.commit()
    db.refresh(rel)

    # Notify senior that family member joined
    try:
        notif = Notification(
            user_id=inv.senior_user_id,
            type="family",
            title=f"❤️ {current_user.full_name} Joined Your Family Circle",
            message=f"{current_user.full_name} accepted your invite as your {rel.relationship_type}. You can manage their permissions anytime.",
            action="family_circle",
            action_payload=json.dumps({"relationship_id": rel.id}),
            read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.commit()
    except Exception:
        pass

    return {
        "status": "success",
        "message": f"Successfully joined {senior_name}'s Family Circle as {rel.relationship_type}!",
        "relationship_id": rel.id,
        "senior_user_id": inv.senior_user_id,
        "senior_name": senior_name,
        "relationship_type": rel.relationship_type
    }


@router.post("/invitations/{token}/reject", summary="Reject Family Invitation")
def reject_family_invitation(token: str, db: Session = Depends(get_db)):
    """Rejects a family invitation."""
    inv = db.query(FamilyInvitation).filter(FamilyInvitation.token == token).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    inv.status = "rejected"
    db.commit()
    return {"status": "success", "message": "Invitation declined."}


@router.put("/members/{relationship_id}/permissions", response_model=FamilyMemberResponse, summary="Update Family Member Permissions (Senior Only)")
def update_family_permissions(
    relationship_id: int,
    payload: FamilyPermissionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows the senior to toggle role-based permissions on/off for any connected family member.
    Enforces that only the primary senior can modify their Family Circle permissions.
    """
    rel = db.query(FamilyRelationship).filter(FamilyRelationship.id == relationship_id).first()
    if not rel:
        raise HTTPException(status_code=404, detail="Family relationship not found.")

    if rel.senior_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only the primary senior citizen can manage Family Circle permissions."
        )

    for perm_key, enabled_val in payload.permissions.items():
        existing_perm = db.query(FamilyPermission).filter(
            FamilyPermission.relationship_id == rel.id,
            FamilyPermission.permission == perm_key
        ).first()

        if existing_perm:
            existing_perm.enabled = enabled_val
        else:
            new_p = FamilyPermission(
                relationship_id=rel.id,
                permission=perm_key,
                enabled=enabled_val
            )
            db.add(new_p)

    db.commit()
    db.refresh(rel)

    return build_family_member_response(rel, db)


@router.delete("/members/{relationship_id}", summary="Remove Family Member (Senior Only)")
def remove_family_member(
    relationship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Senior removes a family member from their Family Circle."""
    rel = db.query(FamilyRelationship).filter(FamilyRelationship.id == relationship_id).first()
    if not rel:
        raise HTTPException(status_code=404, detail="Family relationship not found.")

    if rel.senior_user_id != current_user.id and rel.family_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot delete this relationship."
        )

    fam_name = rel.family_member.full_name if rel.family_member else "Family member"
    db.delete(rel)
    db.commit()

    return {
        "status": "success",
        "message": f"{fam_name} has been removed from the Family Circle."
    }


# --- Family Member Portal Endpoints ---

@router.get("/seniors", response_model=List[ConnectedSeniorResponse], summary="List Connected Seniors for Family Member")
def list_connected_seniors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all seniors who have connected this user to their Family Circle."""
    relationships = db.query(FamilyRelationship).filter(
        FamilyRelationship.family_user_id == current_user.id,
        FamilyRelationship.status == "active"
    ).all()

    results = []
    for r in relationships:
        senior = db.query(User).filter(User.id == r.senior_user_id).first()
        if not senior:
            continue

        perms = db.query(FamilyPermission).filter(FamilyPermission.relationship_id == r.id).all()
        perm_map = {p.permission: p.enabled for p in perms}

        results.append(ConnectedSeniorResponse(
            relationship_id=r.id,
            senior_user_id=senior.id,
            senior_name=senior.full_name,
            senior_avatar=senior.avatar_url,
            senior_location=senior.location_name,
            relationship_type=r.relationship_type,
            status=r.status,
            permissions=perm_map
        ))

    return results


@router.get("/senior/{senior_user_id}/dashboard", response_model=SeniorDashboardForFamilyResponse, summary="Permission-Enforced Senior Dashboard for Family Member")
def get_senior_dashboard_for_family(
    senior_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns senior status, upcoming bookings, and notifications for family member.
    STRICT PERMISSION ENFORCEMENT:
    - VIEW_BOOKINGS -> If false, bookings are omitted.
    - VIEW_SERVICE_DETAILS -> If false, service details are omitted.
    - VIEW_PROVIDER_DETAILS -> If false, provider names/contacts are masked.
    - RECEIVE_NOTIFICATIONS -> If false, notifications feed is omitted.
    """
    rel = db.query(FamilyRelationship).filter(
        FamilyRelationship.senior_user_id == senior_user_id,
        FamilyRelationship.family_user_id == current_user.id,
        FamilyRelationship.status == "active"
    ).first()

    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You are not an active member of this senior's Family Circle."
        )

    senior = db.query(User).filter(User.id == senior_user_id).first()
    if not senior:
        raise HTTPException(status_code=404, detail="Senior user not found.")

    perms = db.query(FamilyPermission).filter(FamilyPermission.relationship_id == rel.id).all()
    perm_map = {p.permission: p.enabled for p in perms}
    granted = [p.permission for p in perms if p.enabled]

    # Senior profile info (masked if VIEW_PROVIDER_DETAILS is false and senior is provider)
    senior_info = {
        "id": senior.id,
        "full_name": senior.full_name,
        "avatar_url": senior.avatar_url,
        "location_name": senior.location_name,
        "user_type": senior.user_type,
        "completed_services_count": senior.completed_services_count or 0,
        "trust_badge_level": senior.trust_badge_level or "verified_senior"
    }

    # 1. Check VIEW_BOOKINGS permission
    upcoming_bookings: Optional[List[BookingResponse]] = None
    if perm_map.get("VIEW_BOOKINGS", False):
        b_list = db.query(Booking).filter(
            (Booking.customer_id == senior.id) | (Booking.provider_id == senior.id)
        ).order_by(Booking.created_at.desc()).all()

        upcoming_bookings = []
        for b in b_list:
            service = db.query(ServiceListing).filter(ServiceListing.id == b.service_id).first()
            customer = db.query(User).filter(User.id == b.customer_id).first()
            provider = db.query(User).filter(User.id == b.provider_id).first()

            # Mask provider/customer names if VIEW_PROVIDER_DETAILS is disabled
            can_view_providers = perm_map.get("VIEW_PROVIDER_DETAILS", False)
            p_name = provider.full_name if (provider and can_view_providers) else "Verified Specialist"
            c_name = customer.full_name if (customer and can_view_providers) else "Client"
            s_title = service.title if (service and perm_map.get("VIEW_SERVICE_DETAILS", False)) else "Scheduled Session"

            upcoming_bookings.append(BookingResponse(
                id=b.id,
                customer_id=b.customer_id,
                provider_id=b.provider_id,
                service_id=b.service_id,
                status=b.status,
                total_price=b.total_price,
                scheduled_date=b.scheduled_date,
                notes=b.notes,
                created_at=b.created_at.isoformat(),
                service_title=s_title,
                provider_name=p_name,
                customer_name=c_name
            ))

    # 2. Check VIEW_SERVICE_DETAILS permission
    services_summary: Optional[List[Dict[str, Any]]] = None
    if perm_map.get("VIEW_SERVICE_DETAILS", False):
        serv_list = db.query(ServiceListing).filter(ServiceListing.provider_id == senior.id).all()
        services_summary = [
            {
                "id": s.id,
                "title": s.title,
                "category": s.category,
                "price_per_hour": s.price_per_hour,
                "service_area": s.service_area,
                "status": s.status
            } for s in serv_list
        ]

    # 3. Check RECEIVE_NOTIFICATIONS permission
    notifications_summary: Optional[List[Dict[str, Any]]] = None
    if perm_map.get("RECEIVE_NOTIFICATIONS", False):
        notif_list = db.query(Notification).filter(Notification.user_id == senior.id).order_by(Notification.created_at.desc()).limit(10).all()
        notifications_summary = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "created_at": n.created_at.isoformat() if n.created_at else ""
            } for n in notif_list
        ]

    return SeniorDashboardForFamilyResponse(
        senior=senior_info,
        relationship={
            "id": rel.id,
            "relationship_type": rel.relationship_type,
            "status": rel.status,
            "connected_since": rel.created_at.strftime("%d %B %Y") if rel.created_at else "August 2026"
        },
        granted_permissions=granted,
        upcoming_bookings=upcoming_bookings,
        services_summary=services_summary,
        notifications=notifications_summary,
        can_help_with_requests=perm_map.get("HELP_WITH_REQUESTS", False)
    )
