from fastapi import APIRouter, Header

from app.repositories import create_journal_entry_in_db, delete_journal_entry_from_db, list_journal_entries_from_db
from app.schemas import JournalEntry
from app.store import journal_entries, make_record

router = APIRouter()


@router.get("/entries")
def list_entries(
    x_harbor_user_id: str = Header(default=""),
    x_harbor_user_name: str = Header(default=""),
):
    db_entries = list_journal_entries_from_db(x_harbor_user_id, x_harbor_user_name)
    if db_entries is not None:
        return {"entries": db_entries}
    return {"entries": journal_entries}


@router.post("/entries")
def create_entry(
    entry: JournalEntry,
    x_harbor_user_id: str = Header(default=""),
    x_harbor_user_name: str = Header(default=""),
):
    db_record = create_journal_entry_in_db(entry, x_harbor_user_id, x_harbor_user_name)
    if db_record is not None:
        return {"message": "Journal entry saved.", "entry": db_record}

    record = make_record(entry.model_dump())
    journal_entries.insert(0, record)
    return {"message": "Journal entry saved.", "entry": record}


@router.delete("/entries/{entry_id}")
def delete_entry(
    entry_id: str,
    x_harbor_user_id: str = Header(default=""),
    x_harbor_user_name: str = Header(default=""),
):
    db_deleted = delete_journal_entry_from_db(entry_id, x_harbor_user_id, x_harbor_user_name)
    if db_deleted is not None:
        return {"message": "Journal entry deleted." if db_deleted else "Journal entry was not found."}

    journal_entries[:] = [entry for entry in journal_entries if entry["id"] != entry_id]
    return {"message": "Journal entry deleted."}
