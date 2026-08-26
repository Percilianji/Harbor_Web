from fastapi import APIRouter

from app.store import healing_tools

router = APIRouter()


@router.get("/tools")
def list_tools():
    return {"tools": healing_tools}
