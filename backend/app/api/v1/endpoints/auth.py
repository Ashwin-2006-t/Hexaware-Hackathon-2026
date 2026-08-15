import re
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError

from app.db.session import get_db
from app.models.domain import User
from app.schemas.domain import UserCreate, UserLogin, UserResponse, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, summary="Register New User (Senior Citizen, Homemaker, or Customer)")
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Validation
    if not user_in.full_name or len(user_in.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters long.")

    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, user_in.email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    # 2. Block duplicate email
    existing = db.query(User).filter(User.email == user_in.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email address is already registered. Please sign in or use another email.")

    # 3. Hash password & save user
    hashed_pw = get_password_hash(user_in.password)
    user_type = user_in.user_type or ("senior" if user_in.role == "provider" else "customer")
    role = "provider" if user_type in ["senior", "homemaker"] else "customer"

    user = User(
        email=user_in.email.strip().lower(),
        hashed_password=hashed_pw,
        full_name=user_in.full_name.strip(),
        role=role,
        user_type=user_type,
        age=user_in.age or (65 if user_type == "senior" else 45 if user_type == "homemaker" else None),
        phone=user_in.phone.strip() if user_in.phone else "+91 98000 00000",
        bio=user_in.bio or ("Senior craftsman and lifelong skill mentor." if user_type == "senior" else "Skilled homemaker offering culinary and tailoring services." if user_type == "homemaker" else "Community member seeking trusted local senior services."),
        avatar_url=user_in.avatar_url or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
        location_name=user_in.location_name or "Mumbai, Maharashtra",
        latitude=user_in.latitude or 19.0760,
        longitude=user_in.longitude or 72.8777,
        languages=user_in.languages or "English, Hindi",
        availability=user_in.availability or "Flexible / Weekday Mornings",
        is_published=True,
        completed_services_count=0,
        trust_badge_level="verified_senior"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 4. Auto-login after signup
    token = create_access_token(user.id)
    
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        user_type=user.user_type,
        age=user.age,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        languages=user.languages,
        availability=user.availability,
        is_published=user.is_published,
        is_active=user.is_active,
        completed_services_count=user.completed_services_count or 0,
        trust_badge_level=user.trust_badge_level or "verified_senior",
        created_at=user.created_at.isoformat()
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.post("/login", response_model=TokenResponse, summary="Log in with email & password")
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.strip().lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password. Please check your credentials.")

    token = create_access_token(user.id)
    
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        user_type=user.user_type,
        age=user.age,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        languages=user.languages,
        availability=user.availability,
        is_published=user.is_published,
        is_active=user.is_active,
        completed_services_count=user.completed_services_count or 0,
        trust_badge_level=user.trust_badge_level or "verified_senior",
        created_at=user.created_at.isoformat()
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.get("/me", response_model=UserResponse, summary="Get Current Logged-in User Profile")
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        user_id = int(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authorization token")

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        user_type=user.user_type,
        age=user.age,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        languages=user.languages,
        availability=user.availability,
        is_published=user.is_published,
        is_active=user.is_active,
        completed_services_count=user.completed_services_count or 0,
        trust_badge_level=user.trust_badge_level or "verified_senior",
        created_at=user.created_at.isoformat()
    )


@router.post("/logout", summary="Log out current user")
def logout():
    return {"status": "success", "message": "Successfully logged out. Please clear client-side token."}
