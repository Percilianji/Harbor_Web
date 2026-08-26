from fastapi import APIRouter

from app.store import awareness_lessons

router = APIRouter()


@router.get("/lessons")
def list_lessons():
    age_groups = ["All ages", *sorted({lesson["age"] for lesson in awareness_lessons})]
    topics = ["All topics", *sorted({lesson["topic"] for lesson in awareness_lessons})]
    return {"lessons": awareness_lessons, "ageGroups": age_groups, "topics": topics}
