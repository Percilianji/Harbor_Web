from fastapi import APIRouter

from app.schemas import VaultCase
from app.store import make_record, vault_cases

router = APIRouter()


@router.get("/cases")
def list_cases():
    return {"cases": vault_cases}


@router.post("/cases")
def create_case(case: VaultCase):
    record = make_record({
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
        "notesLength": len(case.notes),
    })
    vault_cases.insert(0, record)
    return {"message": "Vault case saved.", "case": record}
