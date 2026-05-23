# AI CV Optimizer — Backend Specification (Python)

## Objectif

Créer une feature permettant :

1. De récupérer automatiquement les données d’une offre d’emploi à partir d’une URL
2. De récupérer les données utilisateur depuis Supabase
3. D’utiliser Mistral API pour générer un CV optimisé selon l’offre
4. D’afficher une version du CV maximisant les chances de matching ATS

---

# User Flow

```text
Utilisateur colle URL job
        ↓
Backend scrape l’offre
        ↓
Extraction des données structurées
        ↓
Récupération profil utilisateur Supabase
        ↓
Construction du prompt Mistral
        ↓
Mistral génère :
- résumé optimisé
- expériences prioritaires
- compétences adaptées
- mots-clés ATS
        ↓
Frontend affiche preview CV
        ↓
Utilisateur peut :
- éditer
- exporter PDF
- sauvegarder version
```

---

# Stack Backend recommandée

| Besoin | Tech |
|---|---|
| API | FastAPI |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Queue | Celery ou RQ |
| Redis | cache + queue |
| Scraping | Playwright |
| HTML Parsing | BeautifulSoup / selectolax |
| AI | Mistral API |
| DB | Supabase PostgreSQL |
| Auth | Supabase JWT |
| PDF | WeasyPrint |
| Async HTTP | httpx |

---

# Architecture Backend

```text
/backend
    /app
        /api
        /core
        /services
        /scrapers
        /models
        /schemas
        /workers
        /prompts
        /utils
```

---

# Architecture globale

```text
Frontend
   ↓
FastAPI
   ↓
Job Parsing Service
   ↓
Supabase
   ↓
Mistral Service
   ↓
CV Optimization Engine
   ↓
PDF Generator
```

---

# Backend Responsibilities

Le backend doit :

## 1. Recevoir une URL d’offre

### Exemple

```json
{
  "url": "https://jobs.lever.co/..."
}
```

---

## 2. Scraper le job

Extraire :

- titre
- société
- description
- skills
- localisation
- seniorité

---

## 3. Récupérer le profil utilisateur

Depuis Supabase :

- expériences
- compétences
- langues
- projets
- résumé

---

## 4. Construire le prompt Mistral

Fusion :

```text
job offer + candidate profile
```

---

## 5. Générer CV optimisé

Retour :

- résumé optimisé
- expériences triées
- wording amélioré
- skills ATS

---

# Structure dossiers Python

```text
/app
    main.py

    /api
        jobs.py
        cv.py
        auth.py

    /scrapers
        base.py
        linkedin.py
        greenhouse.py
        lever.py
        generic.py

    /services
        scraper_service.py
        mistral_service.py
        cv_optimizer.py
        ats_service.py
        supabase_service.py

    /schemas
        job.py
        profile.py
        cv.py

    /workers
        tasks.py

    /prompts
        optimize_cv.txt
        extract_job.txt

    /core
        config.py
        security.py
        logging.py
```

---

# FastAPI Endpoints

# 1. Parse Job

## Endpoint

```http
POST /jobs/parse
```

## Request

```json
{
  "url": "https://..."
}
```

## Response

```json
{
  "title": "Senior Frontend Engineer",
  "company": "OpenAI",
  "skills": [
    "React",
    "TypeScript",
    "GraphQL"
  ]
}
```

---

# 2. Optimize CV

## Endpoint

```http
POST /cv/optimize
```

## Request

```json
{
  "jobUrl": "https://..."
}
```

---

# Backend Flow

```text
1. Parse job
2. Fetch profile
3. Build prompt
4. Call Mistral
5. Return optimized CV
```

---

# Scraper Strategy

# 1. Provider Detection

```python
def detect_provider(url: str):
    if "greenhouse.io" in url:
        return "greenhouse"

    if "lever.co" in url:
        return "lever"

    return "generic"
```

---

# 2. Scraper Interface

```python
class BaseScraper:
    async def scrape(self, url: str):
        raise NotImplementedError
```

---

# 3. Greenhouse Scraper

Utiliser :

```text
boards-api.greenhouse.io
```

Plutôt que parser le HTML.

---

# 4. Generic Scraper

Utiliser :

- Playwright
- extraction HTML
- BeautifulSoup

---

# Exemple Playwright

```python
from playwright.async_api import async_playwright

async def get_html(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        page = await browser.new_page()

        await page.goto(url)

        html = await page.content()

        await browser.close()

        return html
```

---

# Parsing HTML

## Recommandation

Utiliser :

- selectolax (ultra rapide)
- fallback BeautifulSoup

---

# Job Extraction Schema

```python
class JobOffer(BaseModel):
    title: str
    company: str
    location: str | None
    description: str
    skills: list[str]
    seniority: str | None
```

---

# Supabase Integration

## SDK Python

- https://supabase.com/docs/reference/python/introduction

---

# Exemple

```python
from supabase import create_client

supabase = create_client(URL, KEY)

response = (
    supabase
    .table("experiences")
    .select("*")
    .eq("user_id", user_id)
    .execute()
)
```

---

# Mistral API Integration

## SDK

- https://docs.mistral.ai

---

# Service dédié

```python
class MistralService:

    async def optimize_cv(
        self,
        profile,
        job
    ):
        ...
```

---

# Prompt Strategy

# System Prompt

```text
Tu es un expert ATS et recrutement tech.

Tu optimises un CV pour maximiser :
- matching ATS
- crédibilité
- clarté
- impact

Tu ne dois jamais inventer d’expérience.
```

---

# User Prompt

```json
{
  "job_offer": {},
  "candidate_profile": {}
}
```

---

# Output attendu

```json
{
  "summary": "",
  "highlighted_skills": [],
  "optimized_experiences": [],
  "missing_keywords": [],
  "ats_score": 85
}
```

---

# Recommendation importante

## Utiliser JSON Mode

Demander à Mistral :

```text
Return ONLY valid JSON
```

Sinon :

- parsing fragile
- erreurs fréquentes

---

# Async Jobs (IMPORTANT)

Le flow peut durer :

- scraping
- navigateur
- AI call

Donc :

- ne pas faire synchrone

---

# Recommandation

## Celery + Redis

Architecture :

```text
FastAPI
   ↓
Redis Queue
   ↓
Worker Celery
   ↓
Mistral
```

---

# Exemple Flow

```text
POST /cv/optimize
    ↓
create task
    ↓
return task_id
    ↓
frontend poll status
```

---

# Task Status Endpoint

```http
GET /tasks/:id
```

## Status

```json
{
  "status": "processing"
}
```

---

# ATS Scoring Engine

## V1 simple

Comparer :

- skills
- keywords
- seniority

## Exemple

```python
score = matched_keywords / total_keywords
```

---

# Database Tables

# optimized_cvs

```sql
CREATE TABLE optimized_cvs (
    id uuid PRIMARY KEY,
    user_id uuid,
    job_url text,
    company text,
    job_title text,
    ats_score int,
    generated_cv jsonb,
    created_at timestamptz
);
```

---

# Caching Strategy

## Cache les jobs déjà scrapés

Pourquoi :

- réduire coût
- éviter blocage
- accélérer

---

# Table

```sql
cached_jobs
```

avec :

```text
url_hash
parsed_json
expires_at
```

---

# Error Handling

## Cas critiques

| Erreur | Solution |
|---|---|
| CAPTCHA | retry |
| Timeout | retry |
| HTML vide | fallback |
| Mistral fail | retry exponential |
| JSON invalide | reprompt |

---

# Sécurité

## Important

Ne jamais :

- exposer Mistral API key
- faire confiance au HTML
- injecter prompts non filtrés

---

# Prompt Injection Protection

Les job descriptions peuvent contenir :

```text
Ignore previous instructions
```

Il faut :

- nettoyer le texte
- limiter tokens
- strip scripts/html

---

# Scalabilité

## V2

Ajouter :

- embeddings
- vector search
- matching IA
- génération cover letter
- auto apply

---

# Recommandation finale architecture

## MVP idéal

```text
FastAPI
+
Playwright
+
Supabase
+
Mistral
+
Celery
+
Redis
```

C’est une stack très robuste pour construire ce produit.
