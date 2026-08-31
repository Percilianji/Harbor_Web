import hashlib
import hmac
import os
from secrets import token_hex

from fastapi import APIRouter, HTTPException

from app.schemas import LoginRequest, PasswordSetupRequest, SignupRequest
from app.store import invite_tokens, make_record, users_by_name

router = APIRouter()


def normalize_name(private_name: str) -> str:
    return private_name.strip().lower()


def hash_password(password: str, salt: str) -> str:
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 120_000)
    return hashed.hex()


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "privateName": user["privateName"],
        "recoveryEmail": user.get("recoveryEmail", ""),
        "officialEmail": user.get("officialEmail", ""),
        "role": user.get("role", "community"),
        "createdAt": user["createdAt"],
    }


@router.post("/signup")
def signup(payload: SignupRequest):
    private_name = payload.privateName.strip()
    normalized = normalize_name(private_name)

    if len(private_name) < 3:
        raise HTTPException(status_code=400, detail="Private name must be at least 3 characters.")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if payload.password != payload.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if normalized in users_by_name:
        raise HTTPException(status_code=409, detail="That private name is already taken.")
    salt = token_hex(16)
    user = make_record({
        "privateName": private_name,
        "normalizedName": normalized,
        "recoveryEmail": payload.recoveryEmail.strip(),
        "role": "community",
        "accountStatus": "active",
        "mustResetPassword": False,
        "passwordSalt": salt,
        "passwordHash": hash_password(payload.password, salt),
    })
    users_by_name[normalized] = user

    return {"message": "Private account created.", "user": public_user(user)}


@router.post("/login")
def login(payload: LoginRequest):
    normalized = normalize_name(payload.privateName)
    super_admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@harbor.cm").strip().lower()
    super_admin_password = os.getenv("SUPER_ADMIN_PASSWORD", "ChangeMeAdmin123!")

    if normalized == super_admin_email and hmac.compare_digest(payload.password, super_admin_password):
        return {
            "message": "Welcome, super admin.",
            "user": {
                "id": "super-admin",
                "privateName": "Super Admin",
                "officialEmail": super_admin_email,
                "recoveryEmail": super_admin_email,
                "role": "admin",
                "createdAt": "system",
            },
        }

    user = users_by_name.get(normalized)

    if not user:
        raise HTTPException(status_code=404, detail="No account exists with that private name. Please sign up first.")

    submitted_hash = hash_password(payload.password, user["passwordSalt"])
    if not hmac.compare_digest(submitted_hash, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Wrong password. Please check it and try again.")
    if user.get("mustResetPassword"):
        raise HTTPException(status_code=403, detail="Please use your email invite link to create a new password first.")

    return {"message": "Welcome back.", "user": public_user(user)}


@router.post("/setup-password")
def setup_password(payload: PasswordSetupRequest):
    invite = invite_tokens.get(payload.token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite link is invalid or expired.")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if payload.password != payload.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    user = next((item for item in users_by_name.values() if item.get("id") == invite["userId"]), None)
    if not user:
        raise HTTPException(status_code=404, detail="Account was not found.")

    salt = token_hex(16)
    user["passwordSalt"] = salt
    user["passwordHash"] = hash_password(payload.password, salt)
    user["mustResetPassword"] = False
    user["accountStatus"] = "active"
    invite_tokens.pop(payload.token, None)

    return {"message": "Password created. You can now log in.", "user": public_user(user)}
