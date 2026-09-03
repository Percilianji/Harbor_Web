from fastapi import APIRouter, Header, HTTPException

from app.repositories import create_vault_case_in_db, list_official_vault_cases_from_db
from app.schemas import VaultCase
from app.store import make_record, vault_cases

router = APIRouter()


@router.get("/cases")
def list_cases(x_harbor_role: str = Header(default="community")):
    if x_harbor_role not in {"government", "ngo", "admin"}:
        raise HTTPException(status_code=403, detail="Official review access required.")
    db_cases = list_official_vault_cases_from_db()
    if db_cases is not None:
        return {"cases": db_cases}
    return {"cases": [case for case in vault_cases if case.get("consentToOfficialReview") or case.get("consent_to_official_review")]}


@router.post("/cases")
def create_case(case: VaultCase):
    db_record = create_vault_case_in_db(case)
    if db_record is not None:
        return {"message": "Vault case saved.", "case": db_record}

    record = make_record({
        "userId": case.userId,
        "userName": case.userName or "Anonymous user",
        "label": case.label,
        "incidentDateTime": case.incidentDateTime,
        "location": case.location,
        "recordType": case.recordType,
        "peopleInvolved": case.peopleInvolved,
        "witnesses": case.witnesses,
        "evidenceFileName": case.evidenceFileName,
        "screenshotReference": case.screenshotReference,
        "medicalLegalFollowUp": case.medicalLegalFollowUp,
        "safetyNotes": case.safetyNotes,
        "notes": case.notes,
        "privateDetails": case.privateDetails,
        "notesLength": len(case.notes),
        "privateDetailsLength": len(case.privateDetails),
        "consentToOfficialReview": case.consentToOfficialReview,
        "status": "new" if case.consentToOfficialReview else "private",
    })
    vault_cases.insert(0, record)
    return {"message": "Vault case saved.", "case": record}
