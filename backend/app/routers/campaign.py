from fastapi import APIRouter, Header, HTTPException

from app.repositories import create_campaign_flyer_in_db, list_campaign_flyers_from_db
from app.schemas import CampaignFlyerRequest

router = APIRouter()


def require_government(x_harbor_role: str) -> None:
    if x_harbor_role != "government":
        raise HTTPException(status_code=403, detail="Government account required.")


@router.get("/flyers")
def list_flyers():
    flyers = list_campaign_flyers_from_db()
    return {"flyers": flyers or []}


@router.post("/flyers")
def create_flyer(
    payload: CampaignFlyerRequest,
    x_harbor_role: str = Header(default="community"),
    x_harbor_user_id: str = Header(default=""),
    x_harbor_user_name: str = Header(default=""),
):
    require_government(x_harbor_role)
    if len(payload.title.strip()) < 2:
        raise HTTPException(status_code=400, detail="Campaign title is required.")
    if not payload.imageUrl.strip():
        raise HTTPException(status_code=400, detail="Campaign flyer image is required.")

    flyer = create_campaign_flyer_in_db(payload, x_harbor_user_id, x_harbor_user_name)
    if flyer is None:
        raise HTTPException(status_code=503, detail="Database is required to save campaign flyers.")
    return {"message": "Campaign flyer saved.", "flyer": flyer}
