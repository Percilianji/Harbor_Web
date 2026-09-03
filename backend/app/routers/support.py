from fastapi import APIRouter

from app.repositories import list_support_resources_from_db, mark_support_resource_reported_in_db
from app.store import resources

router = APIRouter()


@router.get("/resources")
def list_resources():
    db_resources = list_support_resources_from_db()
    if db_resources is not None:
        return {"resources": db_resources}
    return {"resources": resources}


@router.post("/resources/{name}/report")
def report_resource(name: str):
    mark_support_resource_reported_in_db(name)
    return {"message": f"{name} was marked for review."}
