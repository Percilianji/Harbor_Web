from fastapi import APIRouter

router = APIRouter()


@router.get("")
def get_home_content():
    return {
        "hero": {
            "eyebrow": "A private space, built for survivors",
            "title": "Your story is yours told in your own time.",
            "copy": "Share what happened, keep a private record, and find support while staying in control.",
        },
        "trust": ["Anonymous by default", "Private vault", "Delete anytime", "Moderated for safety"],
    }
