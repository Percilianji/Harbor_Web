from fastapi import APIRouter

from app.schemas import JournalEntry
from app.store import journal_entries, make_record

router = APIRouter()


@router.get("/entries")
def list_entries():
    return {"entries": journal_entries}


@router.post("/entries")
def create_entry(entry: JournalEntry):
    record = make_record(entry.model_dump())
    journal_entries.insert(0, record)
    return {"message": "Journal entry saved.", "entry": record}


@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: str):
    journal_entries[:] = [entry for entry in journal_entries if entry["id"] != entry_id]
    return {"message": "Journal entry deleted."}
