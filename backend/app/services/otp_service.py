import random
import string
import smtplib
import os
from datetime import datetime, timedelta
from typing import Optional, Tuple
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app import models
import logging

logger = logging.getLogger(__name__)


class OTPService:

    # ── Generation ────────────────────────────────────────────────────────────

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def create_otp_request(
        db: Session,
        identifier: str,
        identifier_type: str,
        purpose: str = "login",
        user_id: Optional[int] = None,
    ) -> models.OTPRequest:

        OTPService.cleanup_expired_otps(db, identifier, identifier_type)

        # rate-limit: 1 per minute
        recent = db.query(models.OTPRequest).filter(
            and_(
                models.OTPRequest.identifier == identifier,
                models.OTPRequest.identifier_type == identifier_type,
                models.OTPRequest.created_at > datetime.utcnow() - timedelta(minutes=1),
            )
        ).first()
        if recent:
            raise ValueError("Please wait before requesting another OTP")

        otp_code   = OTPService.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        record = models.OTPRequest(
            user_id=user_id,
            identifier=identifier,
            identifier_type=identifier_type,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def verify_otp(
        db: Session,
        identifier: str,
        identifier_type: str,
        otp_code: str,
    ) -> Tuple[bool, Optional[models.OTPRequest], Optional[str]]:

        record = (
            db.query(models.OTPRequest)
            .filter(
                and_(
                    models.OTPRequest.identifier == identifier,
                    models.OTPRequest.identifier_type == identifier_type,
                    models.OTPRequest.is_used == False,
                    models.OTPRequest.expires_at > datetime.utcnow(),
                )
            )
            .order_by(models.OTPRequest.created_at.desc())
            .first()
        )

        if not record:
            return False, None, "OTP not found or expired"

        if record.attempts >= 5:
            return False, record, "Too many incorrect attempts. Please request a new OTP."

        record.attempts += 1
        db.commit()

        if record.otp_code != otp_code:
            remaining = 5 - record.attempts
            return False, record, f"Invalid OTP. {remaining} attempt(s) remaining."

        record.is_used = True
        db.commit()
        return True, record, "OTP verified successfully"

    @staticmethod
    def cleanup_expired_otps(db: Session, identifier: str, identifier_type: str):
        db.query(models.OTPRequest).filter(
            and_(
                models.OTPRequest.identifier == identifier,
                models.OTPRequest.identifier_type == identifier_type,
                or_(
                    models.OTPRequest.expires_at < datetime.utcnow(),
                    models.OTPRequest.is_used == True,
                ),
            )
        ).delete()
        db.commit()

    # ── Email via SMTP ────────────────────────────────────────────────────────

    @staticmethod
    def send_email_otp(email: str, otp_code: str, name: str = None) -> bool:
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")
        from_addr = os.getenv("SMTP_FROM", smtp_user)

        recipient = name or email.split("@")[0]

        # ── If SMTP not configured, log to console only (dev fallback) ────────
        if not smtp_host or not smtp_user:
            logger.warning("SMTP not configured — OTP will only appear in server logs.")
            logger.info(f"[DEV] EMAIL OTP for {email}: {otp_code}")
            print(f"\n{'='*50}")
            print(f"  EMAIL OTP (configure SMTP in .env to send for real)")
            print(f"  To   : {email}")
            print(f"  Code : {otp_code}")
            print(f"{'='*50}\n")
            return True  # still return True so the flow continues

        # ── Real SMTP send ────────────────────────────────────────────────────
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Your ChefAI verification code"
            msg["From"]    = f"ChefAI <{from_addr}>"
            msg["To"]      = email

            html = f"""
            <html><body style="font-family:sans-serif;background:#080c14;color:#f1f5f9;padding:32px">
              <div style="max-width:480px;margin:auto;background:#0f1624;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08)">
                <h2 style="color:#10b981;margin:0 0 8px">🍳 ChefAI</h2>
                <p style="color:#94a3b8;margin:0 0 24px">Your AI-Powered Cooking Assistant</p>
                <p>Hi <strong>{recipient}</strong>,</p>
                <p>Your one-time login code is:</p>
                <div style="text-align:center;margin:24px 0">
                  <span style="font-size:2.5rem;font-weight:800;letter-spacing:12px;color:#10b981">{otp_code}</span>
                </div>
                <p style="color:#64748b;font-size:13px">This code expires in <strong>10 minutes</strong>.<br>
                If you didn't request this, you can safely ignore this email.</p>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0">
                <p style="color:#64748b;font-size:12px;margin:0">Happy cooking! 🥘 — The ChefAI Team</p>
              </div>
            </body></html>
            """

            msg.attach(MIMEText(html, "html"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(from_addr, email, msg.as_string())

            logger.info(f"Email OTP sent to {email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email OTP to {email}: {e}")
            return False

    # ── SMS via Twilio ────────────────────────────────────────────────────────

    @staticmethod
    def send_sms_otp(phone: str, otp_code: str, name: str = None) -> bool:
        account_sid  = os.getenv("TWILIO_ACCOUNT_SID", "")
        auth_token   = os.getenv("TWILIO_AUTH_TOKEN", "")
        from_number  = os.getenv("TWILIO_PHONE_NUMBER", "")

        # ── If Twilio not configured, log to console only (dev fallback) ──────
        if not account_sid or not auth_token or not from_number:
            logger.warning("Twilio not configured — OTP will only appear in server logs.")
            logger.info(f"[DEV] SMS OTP for {phone}: {otp_code}")
            print(f"\n{'='*50}")
            print(f"  SMS OTP (configure Twilio in .env to send for real)")
            print(f"  To   : {phone}")
            print(f"  Code : {otp_code}")
            print(f"{'='*50}\n")
            return True  # still return True so the flow continues

        # ── Real Twilio send ──────────────────────────────────────────────────
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            message = client.messages.create(
                body=f"Your ChefAI code is {otp_code}. Valid for 10 minutes. Do not share this code.",
                from_=from_number,
                to=phone,
            )
            logger.info(f"SMS OTP sent to {phone}, SID={message.sid}")
            return True

        except Exception as e:
            logger.error(f"Failed to send SMS OTP to {phone}: {e}")
            return False

    # ── Dispatcher ────────────────────────────────────────────────────────────

    @staticmethod
    def send_otp(identifier: str, identifier_type: str, otp_code: str, name: str = None) -> bool:
        if identifier_type == "email":
            return OTPService.send_email_otp(identifier, otp_code, name)
        elif identifier_type == "phone":
            return OTPService.send_sms_otp(identifier, otp_code, name)
        return False

    # ── Phone utils ───────────────────────────────────────────────────────────

    @staticmethod
    def normalize_phone(phone: str) -> str:
        digits = ''.join(filter(str.isdigit, phone))
        if len(digits) == 10:
            digits = "1" + digits   # default US country code
        return "+" + digits

    @staticmethod
    def validate_phone(phone: str) -> bool:
        digits = ''.join(filter(str.isdigit, phone))
        return 10 <= len(digits) <= 15
