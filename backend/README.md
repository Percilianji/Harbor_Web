# Harbor Backend

Python FastAPI backend for the Harbor frontend.

## When to create the virtual environment

Create the virtual environment now, before installing backend packages.

```powershell
cd C:\Users\User\Desktop\Harbor\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Copy `.env.example` to `.env` when you are ready to add secrets:

```powershell
Copy-Item .env.example .env
```

Add your OpenAI API key inside `.env`:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_ENABLE_WEB_SEARCH=true
OPENAI_WEB_SEARCH_TOOL=web_search
```

## Run the backend

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or use the simpler runner:

```powershell
python run.py
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Screen endpoint map

- Home: `GET /api/home`
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`
- Share story: `GET /api/share/steps`, `POST /api/share/drafts`, `POST /api/share/submissions`
- Stories: `GET /api/stories`, `POST /api/stories/{index}/reactions`
- Awareness Hub: `GET /api/awareness/lessons`
- Ask Harbor chatbot: `POST /api/chatbot`
- Healing Hub: `GET /api/healing/tools`
- Support: `GET /api/support/resources`, `POST /api/support/resources/{name}/report`
- Journal: `GET /api/journal/entries`, `POST /api/journal/entries`, `DELETE /api/journal/entries/{entry_id}`
- Vault: `GET /api/vault/cases`, `POST /api/vault/cases`
