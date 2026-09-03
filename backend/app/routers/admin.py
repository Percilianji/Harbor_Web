import hashlib
import hmac
import os
from secrets import token_hex, token_urlsafe

from fastapi import APIRouter, Header, HTTPException

from app.repositories import (
    create_official_account_in_db,
    create_support_resource_in_db,
    delete_official_account_from_db,
    delete_support_resource_from_db,
    list_officials_from_db,
    list_support_resources_from_db,
    update_official_account_in_db,
    update_support_resource_in_db,
)
from app.schemas import OfficialAccountRequest, OfficialAccountUpdate, SupportResourceRequest
from app.store import government_profiles, make_record, resources, users_by_name

router = APIRouter()


def normalize_name(value: str) -> str:
    return value.strip().lower()


def hash_password(password: str, salt: str) -> str:
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 120_000)
    return hashed.hex()


def support_resource_payload(payload: SupportResourceRequest) -> dict:
    return {
        "name": payload.name.strip(),
        "type": payload.type.strip() or "Support contact",
        "place": payload.place.strip() or "Cameroon",
        "hours": payload.hours.strip() or "Verify before visiting",
        "languages": payload.languages.strip() or "Ask contact",
        "cost": payload.cost.strip() or "Verify before using",
        "contact": payload.contact.strip(),
        "verified": payload.verified.strip() or "Admin added",
    }


def require_admin(x_harbor_role: str, x_harbor_admin_email: str) -> None:
    super_admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@harbor.cm").strip().lower()
    if x_harbor_role != "admin" or not hmac.compare_digest(x_harbor_admin_email.strip().lower(), super_admin_email):
        raise HTTPException(status_code=403, detail="Admin access required.")


@router.get("/officials")
def list_officials(
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    db_officials = list_officials_from_db()
    if db_officials is not None:
        return {"officials": db_officials}
    return {"officials": government_profiles}


@router.post("/officials")
def create_official(
    payload: OfficialAccountRequest,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)

    private_name = payload.privateName.strip()
    official_email = payload.officialEmail.strip().lower()
    role = payload.role.strip().lower() or "government"
    normalized_name = normalize_name(private_name)
    normalized_email = normalize_name(official_email)

    if role not in {"government", "ngo"}:
        raise HTTPException(status_code=400, detail="Official role must be government or ngo.")
    if len(private_name) < 3:
        raise HTTPException(status_code=400, detail="Official name must be at least 3 characters.")
    if not official_email or "@" not in official_email:
        raise HTTPException(status_code=400, detail="Official email is required.")

    salt = token_hex(16)
    temporary_password = token_urlsafe(12)
    try:
        db_profile = create_official_account_in_db(
            {
                "private_name": private_name,
                "normalized_name": normalized_name,
                "recovery_email": official_email,
                "official_email": official_email,
                "role": role,
                "password_salt": salt,
                "password_hash": hash_password(temporary_password, salt),
            },
            {
                "agency_name": payload.agencyName.strip(),
                "position_title": payload.positionTitle.strip(),
                "official_email": official_email,
                "verification_status": "verified",
            },
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    if db_profile is not None:
        return {
            "message": "Official account created. Share the temporary password with the official.",
            "official": db_profile,
            "temporaryPassword": temporary_password,
        }

    if normalized_name in users_by_name or normalized_email in users_by_name:
        raise HTTPException(status_code=409, detail="That official account already exists.")
    user = make_record({
        "privateName": private_name,
        "normalizedName": normalized_name,
        "recoveryEmail": official_email,
        "officialEmail": official_email,
        "role": role,
        "accountStatus": "active",
        "mustResetPassword": False,
        "passwordSalt": salt,
        "passwordHash": hash_password(temporary_password, salt),
    })
    users_by_name[normalized_name] = user
    users_by_name[normalized_email] = user

    profile = make_record({
        "userId": user["id"],
        "privateName": private_name,
        "officialEmail": official_email,
        "agencyName": payload.agencyName.strip(),
        "positionTitle": payload.positionTitle.strip(),
        "role": role,
        "authorityType": "NGO partner" if role == "ngo" else "Government official",
        "verificationStatus": "verified",
    })
    government_profiles.insert(0, profile)

    return {
        "message": "Official account created. Share the temporary password with the official.",
        "official": profile,
        "temporaryPassword": temporary_password,
    }


@router.get("/officials/{official_id}")
def get_official(
    official_id: str,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    db_officials = list_officials_from_db()
    if db_officials is not None:
        official = next((item for item in db_officials if item["id"] == official_id), None)
        if not official:
            raise HTTPException(status_code=404, detail="Official account was not found.")
        return {"official": official}

    official = next((item for item in government_profiles if item["id"] == official_id), None)
    if not official:
        raise HTTPException(status_code=404, detail="Official account was not found.")
    return {"official": official}


@router.put("/officials/{official_id}")
def update_official(
    official_id: str,
    payload: OfficialAccountUpdate,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    new_name = payload.privateName.strip()
    new_email = payload.officialEmail.strip().lower()
    new_role = payload.role.strip().lower() or "government"

    if new_role not in {"government", "ngo"}:
        raise HTTPException(status_code=400, detail="Official role must be government or ngo.")

    db_official = update_official_account_in_db(official_id, {
        "private_name": new_name,
        "normalized_name": normalize_name(new_name),
        "official_email": new_email,
        "agency_name": payload.agencyName.strip(),
        "position_title": payload.positionTitle.strip(),
        "verification_status": payload.verificationStatus.strip() or "verified",
        "role": new_role,
    })
    if db_official is not None:
        return {"message": "Official account updated.", "official": db_official}

    official = next((item for item in government_profiles if item["id"] == official_id), None)
    if not official:
        raise HTTPException(status_code=404, detail="Official account was not found.")

    user = next((item for item in users_by_name.values() if item.get("id") == official.get("userId")), None)
    old_keys = {normalize_name(official.get("privateName", "")), normalize_name(official.get("officialEmail", ""))}
    new_keys = {normalize_name(new_name), normalize_name(new_email)}

    for key in new_keys:
      existing = users_by_name.get(key)
      if existing and existing.get("id") != official.get("userId"):
          raise HTTPException(status_code=409, detail="Another account already uses that name or email.")

    official.update({
        "privateName": new_name,
        "officialEmail": new_email,
        "agencyName": payload.agencyName.strip(),
        "positionTitle": payload.positionTitle.strip(),
        "role": new_role,
        "authorityType": "NGO partner" if new_role == "ngo" else "Government official",
        "verificationStatus": payload.verificationStatus.strip() or "verified",
    })

    if user:
        for key in old_keys - new_keys:
            users_by_name.pop(key, None)
        user.update({
            "privateName": new_name,
            "normalizedName": normalize_name(new_name),
            "recoveryEmail": new_email,
            "officialEmail": new_email,
            "role": new_role,
        })
        for key in new_keys:
            users_by_name[key] = user

    return {"message": "Official account updated.", "official": official}


@router.delete("/officials/{official_id}")
def delete_official(
    official_id: str,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    db_deleted = delete_official_account_from_db(official_id)
    if db_deleted is True:
        return {"message": "Official account deleted.", "deleted": True}
    if db_deleted is False:
        raise HTTPException(status_code=404, detail="Official account was not found.")

    official = next((item for item in government_profiles if item["id"] == official_id), None)
    if not official:
        raise HTTPException(status_code=404, detail="Official account was not found.")

    government_profiles.remove(official)
    user = next((item for item in users_by_name.values() if item.get("id") == official.get("userId")), None)
    if user:
        for key in {normalize_name(user.get("privateName", "")), normalize_name(user.get("officialEmail", ""))}:
            users_by_name.pop(key, None)

    return {"message": "Official account deleted.", "deleted": True}


@router.get("/support-resources")
def list_support_resources(
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    db_resources = list_support_resources_from_db()
    if db_resources is not None:
        return {"resources": db_resources}
    return {"resources": resources}


@router.post("/support-resources")
def create_support_resource(
    payload: SupportResourceRequest,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    if len(payload.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Support contact name is required.")
    if not payload.contact.strip():
        raise HTTPException(status_code=400, detail="Contact details are required.")

    data = support_resource_payload(payload)
    db_record = create_support_resource_in_db(data)
    if db_record is not None:
        return {"message": "Support contact added.", "resource": db_record}

    record = make_record(data)
    resources.insert(0, record)
    return {"message": "Support contact added.", "resource": record}


@router.put("/support-resources/{resource_id}")
def update_support_resource(
    resource_id: str,
    payload: SupportResourceRequest,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    resource = next((item for item in resources if item.get("id") == resource_id), None)
    data = support_resource_payload(payload)
    db_record = update_support_resource_in_db(resource_id, data)
    if db_record is not None:
        return {"message": "Support contact updated.", "resource": db_record}

    if not resource:
        raise HTTPException(status_code=404, detail="Support contact was not found.")

    resource.update(data)
    return {"message": "Support contact updated.", "resource": resource}


@router.delete("/support-resources/{resource_id}")
def delete_support_resource(
    resource_id: str,
    x_harbor_role: str = Header(default="community"),
    x_harbor_admin_email: str = Header(default=""),
):
    require_admin(x_harbor_role, x_harbor_admin_email)
    db_deleted = delete_support_resource_from_db(resource_id)
    if db_deleted is True:
        return {"message": "Support contact deleted.", "deleted": True}
    if db_deleted is False:
        raise HTTPException(status_code=404, detail="Support contact was not found.")

    resource = next((item for item in resources if item.get("id") == resource_id), None)
    if not resource:
        raise HTTPException(status_code=404, detail="Support contact was not found.")

    resources.remove(resource)
    return {"message": "Support contact deleted.", "deleted": True}
