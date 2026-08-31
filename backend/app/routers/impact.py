from fastapi import APIRouter, Header, HTTPException

router = APIRouter()


@router.get("/government")
def get_government_impact(x_harbor_role: str = Header(default="community")):
    if x_harbor_role != "government":
        raise HTTPException(status_code=403, detail="Government access required.")

    return {
        "metrics": [
            {"label": "Anonymous stories", "value": "42", "copy": "Stories submitted without public identity."},
            {"label": "Support searches", "value": "318", "copy": "People looked for help by city, region, or service."},
            {"label": "Emergency taps", "value": "79", "copy": "People opened 116, 117, or 118 from Harbor."},
            {"label": "Awareness lessons", "value": "506", "copy": "Short lessons opened by students, caregivers, or educators."},
            {"label": "Top needs", "value": "Counselling, police help, legal guidance", "copy": "Aggregated only, never survivor-identifying."},
            {"label": "Priority regions", "value": "Centre, Littoral, North-West", "copy": "Example trend for planning outreach."},
        ]
    }
