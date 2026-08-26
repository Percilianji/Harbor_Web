import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, awareness, chatbot, healing, home, journal, share_story, stories, support, vault

load_dotenv()

app = FastAPI(title="Harbor API", version="0.1.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "harbor-api"}


app.include_router(home.router, prefix="/api/home", tags=["home"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(share_story.router, prefix="/api/share", tags=["share"])
app.include_router(stories.router, prefix="/api/stories", tags=["stories"])
app.include_router(awareness.router, prefix="/api/awareness", tags=["awareness"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(healing.router, prefix="/api/healing", tags=["healing"])
app.include_router(support.router, prefix="/api/support", tags=["support"])
app.include_router(journal.router, prefix="/api/journal", tags=["journal"])
app.include_router(vault.router, prefix="/api/vault", tags=["vault"])
