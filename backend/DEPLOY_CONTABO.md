# Deploy Harbor Backend on a Contabo VPS

These commands assume Ubuntu on the VPS and a repository hosted on GitHub.

## 1. Connect to the server

```bash
ssh root@YOUR_VPS_IP
```

## 2. Install Docker

```bash
apt update
apt install -y ca-certificates curl git docker.io docker-compose-plugin
systemctl enable --now docker
```

## 3. Download the app

```bash
cd /opt
git clone https://github.com/Percilianji/Harbor_Web.git harbor
cd /opt/harbor
```

If the repo is private, use a GitHub token or SSH key instead of the public HTTPS clone.

## 4. Create production environment files

```bash
cp production.env.example .env
cp backend/.env.example backend/.env
nano .env
nano backend/.env
```

Set these root `.env` values:

```env
POSTGRES_DB=harbor
POSTGRES_USER=harbor_user
POSTGRES_PASSWORD=use-a-long-random-password
```

Set these `backend/.env` values:

```env
FRONTEND_ORIGIN=http://YOUR_FRONTEND_DOMAIN_OR_IP
SUPER_ADMIN_EMAIL=your-admin-email@example.com
SUPER_ADMIN_PASSWORD=use-a-long-random-password
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_ENABLE_WEB_SEARCH=true
OPENAI_WEB_SEARCH_TOOL=web_search
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-app-password
SMTP_FROM_EMAIL=your-from-email
```

## 5. Start backend and database

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

## 6. Check the deployment

```bash
docker compose --env-file .env -f docker-compose.prod.yml ps
curl http://127.0.0.1:8000/api/health
```

The API will be available at:

```text
http://YOUR_VPS_IP:8000/api/health
```

## Important

The PostgreSQL database is created and initialized from `backend/database/schema.sql`, but the current FastAPI routes still use in-memory Python data. Wire the routes to `DATABASE_URL` before relying on production persistence.
