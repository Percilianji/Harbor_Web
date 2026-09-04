import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, auth, awareness, campaign, chatbot, healing, home, impact, journal, share_story, stories, support, vault

load_dotenv()

app = FastAPI(title="Harbor API", version="0.1.0")


def get_cors_origins() -> list[str]:
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]
    primary_origin = os.getenv("FRONTEND_ORIGIN", "").strip().rstrip("/")
    origins = [
        primary_origin or "http://127.0.0.1:5173",
        *configured_origins,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://herharborsupport.com",
        "https://www.herharborsupport.com",
    ]
    return list(dict.fromkeys(origin for origin in origins if origin))


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "harbor-api"}


app.include_router(home.router, prefix="/api/home", tags=["home"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(share_story.router, prefix="/api/share", tags=["share"])
app.include_router(stories.router, prefix="/api/stories", tags=["stories"])
app.include_router(awareness.router, prefix="/api/awareness", tags=["awareness"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(healing.router, prefix="/api/healing", tags=["healing"])
app.include_router(support.router, prefix="/api/support", tags=["support"])
app.include_router(campaign.router, prefix="/api/campaign", tags=["campaign"])
app.include_router(impact.router, prefix="/api/impact", tags=["impact"])
app.include_router(journal.router, prefix="/api/journal", tags=["journal"])
app.include_router(vault.router, prefix="/api/vault", tags=["vault"])
