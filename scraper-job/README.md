# Maium — CV Optimizer Backend

FastAPI + Celery API that scrapes job offers and generates AI-optimised CVs via Mistral.

## Stack

| Role | Technology |
|---|---|
| API | FastAPI |
| Task queue | Celery |
| Broker / Cache | Redis |
| Scraping | Playwright + selectolax |
| AI | Mistral API |
| Database | Supabase PostgreSQL |
| Auth | Supabase JWT |

## Quick start

```bash
# 1. Copy and fill in the .env
cp .env.example .env

# 2. Start everything with Docker
docker-compose up --build

# 3. Install Playwright browsers (outside Docker)
playwright install chromium
```

API available at `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`  
Flower (Celery monitoring): `http://localhost:5555`

## Endpoints

### `POST /jobs/parse`
Scrape a job offer.

**Request**
```json
{ "url": "https://jobs.lever.co/openai/abc123" }
```

**Response**
```json
{
  "title": "Senior Frontend Engineer",
  "company": "OpenAI",
  "location": "San Francisco",
  "description": "...",
  "skills": ["React", "TypeScript"],
  "seniority": "Senior"
}
```

---

### `POST /cv/optimize`
Queue a CV optimization as an async task.

**Request**
```json
{ "job_url": "https://boards.greenhouse.io/stripe/jobs/12345" }
```

**Response** `202 Accepted`
```json
{ "task_id": "abc-123", "status": "pending" }
```

---

### `GET /tasks/{task_id}`
Poll the status of an optimization task.

**Response**
```json
{
  "task_id": "abc-123",
  "status": "completed",
  "result": {
    "summary": "...",
    "highlighted_skills": ["React", "TypeScript"],
    "optimized_experiences": [...],
    "missing_keywords": ["GraphQL"],
    "ats_score": 82
  }
}
```

## Architecture

```
POST /cv/optimize
    ↓
FastAPI → Celery task (via Redis)
    ↓
Worker:
    1. scrape_job(url)       → Supabase cache
    2. fetch_user_profile()  → Supabase
    3. MistralService.optimize_cv(profile, job)
    4. ATS score blend (Mistral 70% + local 30%)
    5. save_optimized_cv     → Supabase
    ↓
GET /tasks/{task_id} → result
```

## Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only, never expose client-side) |
| `MISTRAL_API_KEY` | Mistral API key |
| `MISTRAL_MODEL` | Mistral model (default: `mistral-large-latest`) |
| `REDIS_URL` | Redis connection URL |
| `ALLOWED_ORIGINS` | Allowed CORS origins |
| `SCRAPER_TIMEOUT_MS` | Playwright timeout in ms (default: `30000`) |
| `CACHE_TTL_SECONDS` | Job offer cache TTL in seconds (default: `86400`) |
