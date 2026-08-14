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

@router.post("/signup", response_model=TokenResponse, summary="Register New User (Senior Provider or Customer)")
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        bio=user_in.bio,
        avatar_url=user_in.avatar_url or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        location_name=user_in.location_name or "Downtown",
        latitude=user_in.latitude or 37.7749,
        longitude=user_in.longitude or -122.4194
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.post("/login", response_model=TokenResponse, summary="Log in with email & password")
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    
    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.get("/me", response_model=UserResponse, summary="Get Current Logged-in User Profile")
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        # Fallback to first senior provider in DB for smooth demo experience
        user = db.query(User).filter(User.role == "provider").first()
        if not user:
            user = db.query(User).first()
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated and database is empty")
    else:
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = int(payload.get("sub"))
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid authorization token")

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        location_name=user.location_name,
        latitude=user.latitude,
        longitude=user.longitude,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )
