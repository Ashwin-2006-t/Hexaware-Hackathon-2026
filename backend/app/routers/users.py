import re
import hashlib
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.domain import User, ProviderProfile, ServiceRequest, SavedProvider, Review
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Users & Account Lifecycle"])

def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r'[^\d+]', '', phone.strip())
    if not cleaned.startswith('+'):
        cleaned = f"+91{cleaned.lstrip('0')}"
    return cleaned

import hmac

def hash_password(password: str, salt: bytes = None) -> str:
    if salt is None:
        salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}${hashed.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or '$' not in stored_hash:
        return False
    try:
        salt_hex, hash_hex = stored_hash.split('$', 1)
        salt = bytes.fromhex(salt_hex)
        actual = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(actual.hex(), hash_hex)
    except Exception as e:
        print("DEBUG VERIFY ERR:", e)
        return False

# Pydantic Schemas
class UserProfileRequest(BaseModel):
    userId: str
    phone: str
    role: str  # 'SENIOR' or 'CUSTOMER'
    fullName: Optional[str] = "SilverHands User"
    location: Optional[str] = "Chennai, Tamil Nadu"

class UserProfileResponse(BaseModel):
    id: str
    auth_user_id: Optional[str]
    phone: Optional[str]
    full_name: str
    role: str
    profile_setup_completed: bool = False
    location: Optional[str]

    class Config:
        from_attributes = True

class CheckPhoneResponse(BaseModel):
    exists: bool
    role: Optional[str] = None
    profile_setup_completed: bool = False
    normalized_phone: str

class RegisterRequest(BaseModel):
    phone: str
    role: str  # 'SENIOR' or 'CUSTOMER'
    password: str
    fullName: Optional[str] = None
    location: Optional[str] = None

class LoginRequest(BaseModel):
    phone: str
    password: str

class ForgotPasswordRequest(BaseModel):
    phone: str
    newPassword: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

# 1. CHECK PHONE EXISTENCE
@router.get("/users/check-phone", response_model=CheckPhoneResponse)
def check_phone(phone: str, db: Session = Depends(get_db)):
    clean_phone = normalize_phone(phone)
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        raw_digits = re.sub(r'\D', '', phone)
        if len(raw_digits) >= 10:
            user = db.query(User).filter(User.phone.like(f"%{raw_digits[-10:]}")).first()

    return CheckPhoneResponse(
        exists=user is not None,
        role=user.role if user else None,
        profile_setup_completed=user.profile_setup_completed if (user and user.profile_setup_completed) else False,
        normalized_phone=clean_phone
    )

# 2. REGISTER NEW USER
@router.post("/users/register", response_model=AuthTokenResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    clean_phone = normalize_phone(payload.phone)

    existing = db.query(User).filter(User.phone == clean_phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists. Please log in."
        )

    if payload.role not in ["SENIOR", "CUSTOMER"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'SENIOR' or 'CUSTOMER'."
        )

    if not payload.password or len(payload.password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    digits = re.sub(r'\D', '', clean_phone)
    user_id = f"user_{digits[-10:] if len(digits)>=10 else digits}"
    pass_hash = hash_password(payload.password)
    default_name = payload.fullName or (f"Senior {digits[-4:]}" if payload.role == "SENIOR" else f"Customer {digits[-4:]}")

    is_completed = False

    user = User(
        id=user_id,
        auth_user_id=user_id,
        phone=clean_phone,
        password_hash=pass_hash,
        name=default_name,
        email=f"{user_id}@silverhands.app",
        role=payload.role,
        profile_setup_completed=is_completed,
        location=payload.location
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = f"mock_jwt_token_{user.id}"
    return AuthTokenResponse(
        access_token=token,
        user=UserProfileResponse(
            id=user.id,
            auth_user_id=user.auth_user_id,
            phone=user.phone,
            full_name=user.name,
            role=user.role,
            profile_setup_completed=user.profile_setup_completed or False,
            location=user.location
        )
    )

# 3. EXISTING USER LOGIN
@router.post("/users/login", response_model=AuthTokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_phone = normalize_phone(payload.phone)

    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        raw_digits = re.sub(r'\D', '', payload.phone)
        if len(raw_digits) >= 10:
            user = db.query(User).filter(User.phone.like(f"%{raw_digits[-10:]}")).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password."
        )

    if user.password_hash:
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password."
            )

    token = f"mock_jwt_token_{user.id}"
    return AuthTokenResponse(
        access_token=token,
        user=UserProfileResponse(
            id=user.id,
            auth_user_id=user.auth_user_id,
            phone=user.phone,
            full_name=user.name,
            role=user.role,
            profile_setup_completed=user.profile_setup_completed or False,
            location=user.location
        )
    )

# 4. FORGOT PASSWORD
@router.post("/users/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_phone = normalize_phone(payload.phone)

    if not payload.newPassword or len(payload.newPassword.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        raw_digits = re.sub(r'\D', '', payload.phone)
        if len(raw_digits) >= 10:
            user = db.query(User).filter(User.phone.like(f"%{raw_digits[-10:]}")).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please register for a new account."
        )

    user.password_hash = hash_password(payload.newPassword)
    db.commit()

    return {"message": "Password updated successfully. Please log in with your new password."}

# 5. LEGACY USER PROFILE SAVE / UPDATE
@router.post("/users/profile", response_model=UserProfileResponse)
def save_user_profile(
    payload: UserProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user and payload.userId and payload.userId != current_user.id and payload.userId != current_user.auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only save or update your own profile."
        )

    target_id = current_user.id if current_user else payload.userId
    user = db.query(User).filter((User.auth_user_id == target_id) | (User.id == target_id)).first()
    if not user:
        user = User(
            id=target_id,
            auth_user_id=target_id,
            name=payload.fullName or f"User {payload.phone[-4:]}",
            email=f"{target_id}@silverhands.app",
            phone=payload.phone,
            role=payload.role,
            profile_setup_completed=True,
            location=payload.location
        )
        db.add(user)
    else:
        user.role = payload.role
        if payload.phone:
            user.phone = payload.phone
        if payload.fullName and payload.fullName != "SilverHands User":
            user.name = payload.fullName
        if payload.location:
            user.location = payload.location
        user.profile_setup_completed = True

    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=user.id,
        auth_user_id=user.auth_user_id,
        phone=user.phone,
        full_name=user.name,
        role=user.role,
        profile_setup_completed=user.profile_setup_completed or False,
        location=user.location
    )

# 6. GET USER PROFILE BY ID
@router.get("/users/{user_id}", response_model=UserProfileResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.auth_user_id == user_id) | (User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return UserProfileResponse(
        id=user.id,
        auth_user_id=user.auth_user_id,
        phone=user.phone,
        full_name=user.name,
        role=user.role,
        profile_setup_completed=user.profile_setup_completed or False,
        location=user.location
    )

# 7. MARK PROFILE SETUP AS COMPLETED
@router.post("/users/profile-setup-complete")
def mark_profile_setup_complete(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.profile_setup_completed = True
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Senior profile setup marked as completed.",
        "profile_setup_completed": True
    }

# 7. AUTHENTICATED ACCOUNT DELETION ENDPOINT
@router.delete("/account/me")
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Destructive account deletion endpoint for current authenticated user.
    STRICT SAFETY:
    1. Authenticates current user from JWT token (IDOR safe!).
    2. Verifies active request safety (blocks deletion if user has PENDING or ACCEPTED requests).
    3. Cascades and deletes user profile, skills, services, matches, saved providers, and account data.
    """
    active_cust_reqs = db.query(ServiceRequest).filter(
        ServiceRequest.customer_id == current_user.id,
        ServiceRequest.status.in_(["PENDING", "ACCEPTED", "open"])
    ).count()

    active_prov_reqs = 0
    if current_user.profile:
        active_prov_reqs = db.query(ServiceRequest).filter(
            ServiceRequest.provider_id == current_user.profile.id,
            ServiceRequest.status.in_(["PENDING", "ACCEPTED", "open"])
        ).count()

    if active_cust_reqs > 0 or active_prov_reqs > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have active service requests. Please resolve or cancel them before deleting your account."
        )

    provider_profile_id = current_user.profile.id if current_user.profile else "NONE"
    db.query(SavedProvider).filter(
        (SavedProvider.customer_id == current_user.id) |
        (SavedProvider.provider_id == provider_profile_id)
    ).delete(synchronize_session=False)

    db.query(Review).filter(
        (Review.customer_id == current_user.id) |
        (Review.provider_id == provider_profile_id)
    ).delete(synchronize_session=False)

    if current_user.profile:
        db.delete(current_user.profile)

    deleted_id = current_user.id
    db.delete(current_user)
    db.commit()

    return {"message": "Account successfully deleted.", "user_id": deleted_id}
