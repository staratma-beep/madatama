import os
from datetime import datetime, timedelta
import re
from typing import Optional, List
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Security, Request, Response, status, Depends
from fastapi.security import APIKeyCookie
from pydantic import BaseModel, Field, field_validator
import uuid

# Konfigurasi Kriptografi
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-madatama-2026") # Sebaiknya minimal 32 bytes di .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Minimal Cost 12 untuk Bcrypt seperti enterprise standard (Argon2id juga bisa menggunakan passlib)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Skema MongoDB Users
class UserSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    name: str
    role: str # "Owner", "Produksi", "Kasir"
    is_active: bool = True
    must_change_password: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    failed_login_attempts: int = 0
    locked_until: Optional[str] = None

class CreateUserRequest(BaseModel):
    username: str
    password: str
    name: str
    role: str

    @field_validator('password')
    def validate_password(cls, v, info):
        # 1. Kompleksitas: Minimal 12 karakter, huruf besar, kecil, angka, simbol
        if len(v) < 12:
            raise ValueError("Password minimal 12 karakter")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password harus mengandung huruf besar")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password harus mengandung huruf kecil")
        if not re.search(r"\d", v):
            raise ValueError("Password harus mengandung angka")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password harus mengandung simbol khusus")
        # 2. Proteksi Entropi Dasar
        username = info.data.get("username", "")
        if username and username.lower() in v.lower():
            raise ValueError("Password tidak boleh mengandung username")
        if "madatama" in v.lower():
            raise ValueError("Password tidak boleh mengandung nama bisnis")
        return v

class LoginAuditSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    ip_address: str
    status: str # "SUCCESS", "FAILED", "LOCKED"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Utility Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Cookie Authentication Extractor
oauth2_scheme = APIKeyCookie(name="access_token", auto_error=False)

def get_token_from_cookie(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Sesi telah berakhir atau tidak valid")
    return token
