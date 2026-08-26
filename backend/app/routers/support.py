from fastapi import APIRouter

from app.store import resources

router = APIRouter()


@router.get("/resources")
def list_resources():
    return {"resources": resources}


@router.post("/resources/{name}/report")
def report_resource(name: str):
    return {"message": f"{name} was marked for review."}
