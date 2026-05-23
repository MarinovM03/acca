# Acca

Real-time football accumulator tracker. Log multi-leg bets, watch them resolve live as matches unfold, and analyse your long-term performance. Built with Angular 18, FastAPI, PostgreSQL, and Redis. A tracking and analytics tool — not a gambling platform.

---

## Repository layout

```
acca/
├── client/              Angular 18+ standalone app (frontend)
├── server/              FastAPI app (backend)
├── docker-compose.yml   Postgres 16 + Redis 7 for local development
├── .env.example         Documented environment variables
└── CLAUDE.md            Architecture, conventions, and project goals
```

The app code (frontend and backend) runs on the host. Only Postgres and Redis live in Docker during development.

---

## Prerequisites

Install these once on your machine:

| Tool                | Version       | Notes                                    |
|---------------------|---------------|------------------------------------------|
| Node.js             | 20.x or 22.x  | Comes with npm.                          |
| Python              | 3.12+         | Make sure it is on `PATH`.               |
| Docker Desktop      | latest        | For Postgres and Redis containers.       |
| Git                 | any recent    | For version control.                     |

Optional but convenient:
- **Angular CLI** globally: `npm install -g @angular/cli` (you can also use `npx ng …`).

---

## First-time setup (Windows / PowerShell)

### 1. Clone and configure environment

```powershell
git clone <repo-url> acca
cd acca
Copy-Item .env.example .env          # edit the values if needed
Copy-Item server\.env.example server\.env
```

### 2. Start Postgres and Redis

```powershell
docker compose up -d
docker compose ps                    # confirm both services are healthy
```

### 3. Backend

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

The API will be available at <http://localhost:8000>. Hit <http://localhost:8000/health> — you should see `{"status":"ok"}`.

Interactive docs: <http://localhost:8000/docs>.

### 4. Frontend

In a separate terminal:

```powershell
cd client
npm install
npm start
```

The app will be available at <http://localhost:4200>. The home screen pings the backend's `/health` and renders the result.

---

## Day-to-day commands

### Backend

```powershell
cd server
.\.venv\Scripts\Activate.ps1

uvicorn app.main:app --reload         # run dev server
pytest                                # run tests
ruff check .                          # lint
ruff format .                         # format (or: black .)
alembic revision --autogenerate -m "<message>"   # create a migration
alembic upgrade head                  # apply migrations
```

### Frontend

```powershell
cd client

npm start                             # ng serve on :4200
npm test                              # Karma + Jasmine unit tests
npm run build                         # production build
```

### Dependencies (Postgres + Redis)

```powershell
docker compose up -d
docker compose down                   # stop containers, keep data
docker compose down -v                # stop containers AND wipe data
```

---

## Environment variables

See [`.env.example`](.env.example) at the repo root for the full list and inline documentation. Each half of the app loads its own copy:

- **Backend** reads from `server/.env`.
- **Frontend** reads from `client/src/environments/environment*.ts`.

Never commit `.env`. The `.gitignore` enforces this.

---

## Architecture and conventions

Significant design decisions are recorded in [`docs/adr/`](docs/adr/README.md). Start with [ADR-0001](docs/adr/0001-stack-and-layered-architecture.md) for the stack and backend layering rationale.

---

## Status

Scaffolding complete. No feature code yet. Next up: data model + auth.
