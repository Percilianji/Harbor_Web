from fastapi import APIRouter, Header, HTTPException

from app.repositories import (
    create_awareness_lesson_in_db,
    delete_awareness_lesson_from_db,
    list_awareness_lessons_from_db,
    update_awareness_lesson_in_db,
)
from app.schemas import AwarenessLessonRequest
from app.store import make_record
from app.store import awareness_lessons

router = APIRouter()


def require_official(x_harbor_role: str) -> None:
    if x_harbor_role not in {"government", "ngo", "admin"}:
        raise HTTPException(status_code=403, detail="Official access required.")


@router.get("/lessons")
def list_lessons():
    lessons = list_awareness_lessons_from_db()
    if lessons is None:
        lessons = awareness_lessons
    age_groups = ["All ages", *sorted({lesson["age"] for lesson in lessons})]
    topics = ["All topics", *sorted({lesson["topic"] for lesson in lessons})]
    return {"lessons": lessons, "ageGroups": age_groups, "topics": topics}


@router.post("/lessons")
def create_lesson(payload: AwarenessLessonRequest, x_harbor_role: str = Header(default="community")):
    require_official(x_harbor_role)
    db_record = create_awareness_lesson_in_db(payload)
    if db_record is not None:
        return {"message": "Awareness content created.", "lesson": db_record}

    record = make_record(payload.model_dump())
    if not record.get("publishedAt"):
        record["publishedAt"] = record["createdAt"].split(" ")[0]
    awareness_lessons.insert(0, record)
    return {"message": "Awareness content created.", "lesson": record}


@router.put("/lessons/{lesson_id}")
def update_lesson(lesson_id: str, payload: AwarenessLessonRequest, x_harbor_role: str = Header(default="community")):
    require_official(x_harbor_role)
    db_record = update_awareness_lesson_in_db(lesson_id, payload)
    if db_record is not None:
        return {"message": "Awareness content updated.", "lesson": db_record}

    index = next((item_index for item_index, item in enumerate(awareness_lessons) if str(item.get("id", item.get("title"))) == lesson_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Awareness content was not found.")
    updated = {**awareness_lessons[index], **payload.model_dump()}
    awareness_lessons[index] = updated
    return {"message": "Awareness content updated.", "lesson": updated}


@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: str, x_harbor_role: str = Header(default="community")):
    require_official(x_harbor_role)
    db_record = delete_awareness_lesson_from_db(lesson_id)
    if db_record is not None:
        return {"message": "Awareness content deleted.", "deleted": True, "lesson": db_record}

    index = next((item_index for item_index, item in enumerate(awareness_lessons) if str(item.get("id", item.get("title"))) == lesson_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Awareness content was not found.")
    deleted = awareness_lessons.pop(index)
    return {"message": "Awareness content deleted.", "deleted": True, "lesson": deleted}
