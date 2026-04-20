"""
Security utilities for ETE Digital
- Password hashing (Argon2 via argon2-cffi)
- JWT token generation and validation
- Field-level encryption (Fernet)
- RBAC decorators
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import jwt
from jwt import PyJWTError as JWTError
from cryptography.fernet import Fernet
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import hashlib
import secrets
import string

try:
    import pyotp
    PYOTP_AVAILABLE = True
except ImportError:
    PYOTP_AVAILABLE = False

from app.core.config import settings

# Password hashing with Argon2 (argon2-cffi — actively maintained)
_ph = PasswordHasher()

# HTTP Bearer token scheme
security = HTTPBearer()


# ========== Password Hashing ==========


def hash_password(password: str) -> str:
    """Hash password using Argon2id (argon2-cffi)"""
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2 hash"""
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def validate_password_strength(password: str) -> bool:
    """
    Validate password meets security requirements:
    - Minimum length
    - Contains uppercase, lowercase, digit, special char
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False

    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)

    checks = []
    if settings.PASSWORD_REQUIRE_UPPERCASE:
        checks.append(has_upper)
    if settings.PASSWORD_REQUIRE_LOWERCASE:
        checks.append(has_lower)
    if settings.PASSWORD_REQUIRE_DIGIT:
        checks.append(has_digit)
    if settings.PASSWORD_REQUIRE_SPECIAL:
        checks.append(has_special)

    return all(checks)


# ========== JWT Tokens ==========


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Safe JWT decode for use outside of HTTP context (e.g., WebSocket).
    Returns payload dict on success, None on any failure.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


# ========== Field-Level Encryption ==========


class FieldEncryption:
    """Encrypt/decrypt sensitive fields using Fernet symmetric encryption"""

    def __init__(self, key: str):
        # Derive a proper Fernet key from the settings key
        key_bytes = hashlib.sha256(key.encode()).digest()
        self.fernet = Fernet(base64.urlsafe_b64encode(key_bytes))

    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext to base64 string"""
        if not plaintext:
            return ""
        encrypted = self.fernet.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64 string to plaintext"""
        if not ciphertext:
            return ""
        encrypted = base64.urlsafe_b64decode(ciphertext.encode())
        decrypted = self.fernet.decrypt(encrypted)
        return decrypted.decode()


# Singleton instance
field_encryptor = FieldEncryption(settings.ENCRYPTION_KEY)


def encrypt_field(value: str) -> str:
    """Encrypt a field value"""
    return field_encryptor.encrypt(value)


def decrypt_field(value: str) -> str:
    """Decrypt a field value — returns original if decryption fails"""
    if not value:
        return value
    try:
        return field_encryptor.decrypt(value)
    except Exception:
        # Value wasn't encrypted (e.g., old data or test data) — return as-is
        return value


# ========== Two-Factor Authentication (TOTP) ==========


def generate_totp_secret() -> str:
    """
    Generate a cryptographically random Base32 TOTP secret.
    Store this encrypted in users.totp_secret.
    Compatible with Google Authenticator, Authy, 1Password, etc.
    """
    if PYOTP_AVAILABLE:
        return pyotp.random_base32()
    # Fallback: manual Base32 secret if pyotp not installed yet
    alphabet = string.ascii_uppercase + "234567"  # Base32 charset
    return "".join(secrets.choice(alphabet) for _ in range(32))


def verify_totp_code(secret: str, code: str) -> bool:
    """
    Verify a 6-digit TOTP code against the stored secret.
    Allows 1 time-step window (30s before/after) to handle clock drift.
    Returns False if pyotp is not installed.
    """
    if not PYOTP_AVAILABLE:
        return False
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)
    except Exception:
        return False


def generate_backup_codes(count: int = 8) -> tuple[List[str], List[str]]:
    """
    Generate one-time backup codes for 2FA recovery.
    Returns: (plaintext_codes_for_user, hashed_codes_for_db)
    Show plaintext to user ONCE. Store only hashed versions in DB.
    Format: XXXX-XXXX-XXXX (12 alphanumeric chars with dashes)
    """
    plaintext = []
    hashed = []
    for _ in range(count):
        code = secrets.token_hex(6).upper()  # 12 hex chars
        formatted = f"{code[:4]}-{code[4:8]}-{code[8:]}"  # e.g. A1B2-C3D4-E5F6
        plaintext.append(formatted)
        # Hash backup code (SHA-256 is fine — they're long random codes)
        code_hash = hashlib.sha256(formatted.encode()).hexdigest()
        hashed.append(code_hash)
    return plaintext, hashed


def verify_backup_code(code: str, hashed_codes: List[str]) -> tuple[bool, List[str]]:
    """
    Verify a backup code against the stored hashed list.
    Returns (is_valid, remaining_codes_after_removal).
    Backup codes are single-use — the used code is removed.
    """
    code_hash = hashlib.sha256(code.upper().replace(" ", "").encode()).hexdigest()
    if code_hash in hashed_codes:
        remaining = [h for h in hashed_codes if h != code_hash]
        return True, remaining
    return False, hashed_codes


def generate_totp_qr_url(email: str, secret: str, issuer: str = "Jobrows") -> str:
    """
    Generate the otpauth:// URI for QR code display.
    The frontend renders this as a QR code for the user to scan.
    """
    if PYOTP_AVAILABLE:
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=issuer)
    # Fallback URL format
    return f"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"


# ========== RBAC Decorators ==========


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to get current authenticated user from JWT token
    Returns user_id and role from token payload
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "").lower(),  # normalise to lowercase
    }


def require_role(*allowed_roles):
    """
    FastAPI dependency factory to require specific roles.
    Usage: current_user: dict = Depends(require_role(UserRole.EMPLOYER))

    Returns a dependency function that FastAPI can inject, which validates
    the user's role and returns the current_user dict.
    """
    # Convert enum values to their string values for comparison
    role_values = set()
    for r in allowed_roles:
        if hasattr(r, "value"):
            role_values.add(r.value)
        else:
            role_values.add(str(r))

    async def _require_role(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ):
        token = credentials.credentials
        payload = decode_token(token)

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        user_role = payload.get("role", "").lower()  # normalise to lowercase
        if user_role not in role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(role_values)}",
            )

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": user_role,
        }

    return _require_role


# ========== Optional Authentication ==========


security_optional = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
) -> Optional[Dict[str, Any]]:
    """
    Dependency that returns the current user dict if a valid Bearer token is provided,
    or None if the request is unauthenticated. Never raises an error.

    Use this for endpoints that have different behavior for authenticated vs. anonymous
    users (e.g., ranked vs. unranked job feeds).
    """
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role", "").lower(),
        }
    except Exception:
        return None
