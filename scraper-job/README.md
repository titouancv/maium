# Maium — CV Optimizer Backend

FastAPI API that scrapes job offers and generates AI-optimised CVs via Mistral.

## Stack

| Role | Technology |
|---|---|
| API | FastAPI |
| Task queue | Celery (used for `match-score` only) |
| Broker / Cache | Redis |
| Scraping | Playwright + selectolax + BeautifulSoup |
| AI | Mistral API |
| Database | Supabase PostgreSQL |

## Quick start

```bash
# 1. Copy and fill in the .env
cp .env.example .env

# 2. Start everything with Docker
docker compose up --build
```

API available at `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`  
Flower (Celery monitoring): `http://localhost:5555`

---

## Endpoints

### `POST /jobs/parse`
Scrape a job offer and return structured data.

**Request**
```json
{ "url": "https://jobs.lever.co/mistral/abc-123" }
```

**Response** `200`
```json
{
  "title": "Senior Frontend Engineer",
  "company": "Mistral",
  "location": "Paris",
  "description": "...",
  "skills": ["React", "TypeScript"],
  "seniority": "Senior"
}
```

---

### `POST /cv/optimize`
**Synchronous** pipeline: scrape job → fetch user profile → Mistral → return optimised CV.

**Request**
```json
{
  "job_url": "https://jobs.lever.co/mistral/abc-123",
  "user_id": "<supabase user uuid>"
}
```

**Response** `200`
```json
{
  "summary": "Experienced frontend engineer...",
  "highlighted_skills": ["React", "TypeScript", "GraphQL"],
  "optimized_experiences": [
    {
      "title": "Frontend Engineer",
      "company": "Acme",
      "period": "Jan 2022 - Dec 2024",
      "bullet_points": ["Built a dashboard used by 10k users...", "..."]
    }
  ],
  "missing_keywords_before": ["Kubernetes", "GraphQL", "Go"],
  "missing_keywords_after": ["Go"],
  "ats_score_before": 34,
  "ats_score_after": 61
}
```

| Field | Description |
|---|---|
| `missing_keywords_before` | Keywords from the job offer absent from the original profile |
| `missing_keywords_after` | Keywords that could NOT be added (candidate has no background) |
| `ats_score_before` | ATS score of the original profile vs the job offer (0–100) |
| `ats_score_after` | ATS score of the optimised CV vs the job offer (0–100) |

---

### `POST /cv/match-score`
Queue a CV–job compatibility analysis (async Celery task).

**Request**
```json
{
  "job_url": "https://jobs.lever.co/mistral/abc-123",
  "user_id": "<supabase user uuid>"
}
```

**Response** `202 Accepted`
```json
{ "task_id": "abc-123", "status": "pending" }
```

Poll `GET /tasks/match/{task_id}` for the result.

---

### `GET /tasks/match/{task_id}`
Poll the status of a match-score task.

**Response**
```json
{
  "task_id": "abc-123",
  "status": "completed",
  "result": {
    "match_score": 74,
    "experience_match": 80,
    "skills_match": {
      "matched": ["React", "TypeScript"],
      "missing": ["Go"],
      "bonus": ["Figma"]
    },
    "strengths": ["Strong frontend background"],
    "gaps": ["No backend experience in Go"],
    "profile_summary": "...",
    "recommendation": "..."
  }
}
```

---

## Architecture

### `POST /cv/optimize` — synchronous

```
POST /cv/optimize  { job_url, user_id }
        ↓
  1. scrape_job(url)              → Supabase cache (24 h)
  2. fetch_user_profile(user_id)  → Supabase
  3. MistralService.optimize_cv(profile, job)
  4. compute_ats_score(original profile)  → ats_score_before
  5. compute_ats_score(optimised CV)      → ats_score_after
  6. save_optimized_cv → Supabase (non-fatal)
        ↓
  200 OK  { OptimizedCV }
```

### `POST /cv/match-score` — async via Celery

```
POST /cv/match-score  { job_url, user_id }
        ↓
  Celery task queued in Redis
        ↓ (worker)
  1. scrape_job(url)
  2. fetch_user_profile(user_id)
  3. MistralService.score_match(profile, job)
        ↓
GET /tasks/match/{task_id}  → MatchScoreResult
```

---

## Supported job boards

| Board | Method |
|---|---|
| Greenhouse | Public API (`boards-api.greenhouse.io`) |
| Lever | Public API (`api.lever.co`) |
| Generic | Playwright headless browser |

---

## Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend only, never expose client-side) |
| `MISTRAL_API_KEY` | Mistral API key |
| `MISTRAL_MODEL` | Mistral model (default: `mistral-large-latest`) |
| `REDIS_URL` | Redis connection URL |
| `ALLOWED_ORIGINS` | Allowed CORS origins (e.g. `http://localhost:3000`) |
| `SCRAPER_TIMEOUT_MS` | Playwright timeout in ms (default: `30000`) |
| `CACHE_TTL_SECONDS` | Job offer cache TTL in seconds (default: `86400`) |
