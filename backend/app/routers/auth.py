from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.otp_service import OTPService
from datetime import datetime
import re

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def log_login_attempt(db: Session, email: str, success: bool, ip_address: str,
                       user_agent: str, reason: str = "", user_id: int = None):
    try:
        log = models.LoginLog(
            user_id=user_id,
            email=email,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent,
            reason=reason
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to log login attempt: {e}")
        db.rollback()


def is_email(value: str) -> bool:
    return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', value))


def is_phone(value: str) -> bool:
    digits = re.sub(r'\D', '', value)
    return 10 <= len(digits) <= 15


# ─── Classic Auth ─────────────────────────────────────────────────────────────

@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user_data.phone:
        phone_exists = db.query(models.User).filter(models.User.phone == user_data.phone).first()
        if phone_exists:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    user = models.User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password=hash_password(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        log_login_attempt(db, credentials.email, False, client_ip, user_agent, "Invalid credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        log_login_attempt(db, credentials.email, False, client_ip, user_agent, "Account deactivated")
        raise HTTPException(status_code=403, detail="Account is deactivated")

    log_login_attempt(db, credentials.email, True, client_ip, user_agent, "Success", user.id)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


# ─── OTP Auth ─────────────────────────────────────────────────────────────────

@router.post("/send-otp")
def send_otp(data: schemas.OTPRequest, db: Session = Depends(get_db)):
    """Step 1 — send OTP to email or phone"""
    identifier = data.identifier.strip()
    id_type    = data.identifier_type   # 'email' | 'phone'

    # Validate format
    if id_type == "email" and not is_email(identifier):
        raise HTTPException(status_code=400, detail="Invalid email address")
    if id_type == "phone" and not is_phone(identifier):
        raise HTTPException(status_code=400, detail="Invalid phone number (10-15 digits required)")

    # Look up existing user
    if id_type == "email":
        user = db.query(models.User).filter(models.User.email == identifier).first()
    else:
        normalized = OTPService.normalize_phone(identifier)
        user = db.query(models.User).filter(models.User.phone == normalized).first()
        identifier = normalized   # store normalised form

    user_id   = user.id   if user else None
    user_name = user.name if user else None

    # Create OTP record
    try:
        otp_record = OTPService.create_otp_request(
            db=db,
            identifier=identifier,
            identifier_type=id_type,
            purpose="login",
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))

    # Send it
    sent = OTPService.send_otp(identifier, id_type, otp_record.otp_code, user_name)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP")

    is_new_user = user is None
    response = {
        "message": f"OTP sent to your {id_type}",
        "identifier": identifier,
        "identifier_type": id_type,
        "is_new_user": is_new_user,
    }
    # In DEBUG mode, expose OTP in response so dev can test without SMTP/Twilio
    from app.config import settings as _s
    if _s.DEBUG:
        response["dev_otp"] = otp_record.otp_code
    return response


@router.post("/verify-otp", response_model=schemas.Token)
def verify_otp(data: schemas.OTPVerification, db: Session = Depends(get_db)):
    """Step 2 — verify OTP and return JWT"""
    identifier = data.identifier.strip()
    id_type    = data.identifier_type

    # Normalise phone
    if id_type == "phone":
        identifier = OTPService.normalize_phone(identifier)

    success, otp_record, message = OTPService.verify_otp(
        db=db,
        identifier=identifier,
        identifier_type=id_type,
        otp_code=data.otp_code.strip()
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    # Find or create user
    if id_type == "email":
        user = db.query(models.User).filter(models.User.email == identifier).first()
    else:
        user = db.query(models.User).filter(models.User.phone == identifier).first()

    if not user:
        # New user — name is required
        if not data.name or not data.name.strip():
            raise HTTPException(status_code=400, detail="Name is required for new users")

        # Build a placeholder email for phone-only users
        placeholder_email = (
            identifier if id_type == "email"
            else f"phone_{re.sub(r'\\D', '', identifier)}@chefai.local"
        )

        existing_email = db.query(models.User).filter(models.User.email == placeholder_email).first()
        if existing_email:
            user = existing_email
        else:
            user = models.User(
                name=data.name.strip(),
                email=placeholder_email,
                phone=identifier if id_type == "phone" else None,
                password=hash_password("otp_user_no_password"),
                phone_verified=(id_type == "phone"),
                email_verified=(id_type == "email"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        # Mark verified
        if id_type == "phone":
            user.phone_verified = True
        else:
            user.email_verified = True
        db.commit()

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Update otp_record user_id if it was created before signup
    if otp_record and otp_record.user_id is None:
        otp_record.user_id = user.id
        db.commit()

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


# ─── Standard endpoints ───────────────────────────────────────────────────────

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/logout", response_model=schemas.MessageResponse)
def logout(current_user: models.User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.get("/login-logs")
def get_login_logs(current_user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    query = (
        db.query(models.LoginLog, models.User.name.label("user_name"))
        .outerjoin(models.User, models.LoginLog.user_id == models.User.id)
    )
    if current_user.role != "admin":
        query = query.filter(models.LoginLog.user_id == current_user.id)
    limit = 100 if current_user.role == "admin" else 50
    results = query.order_by(models.LoginLog.login_time.desc()).limit(limit).all()

    logs = []
    for log, user_name in results:
        logs.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": user_name,
            "email": log.email,
            "success": log.success,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "reason": log.reason,
            "login_time": log.login_time.isoformat() if log.login_time else None
        })
    return {"logs": logs}
