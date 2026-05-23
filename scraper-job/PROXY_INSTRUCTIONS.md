# Next.js Proxy Implementation Instructions

## Goal
Create Next.js API routes that act as a proxy between the frontend and the FastAPI backend.
The browser never calls FastAPI directly — everything goes through Next.js.

## Flow
```
Browser
  ↓ fetch("/api/cv/optimize")   ← same domain, cookies sent automatically
Next.js API route               ← reads Supabase cookie, extracts user_id
  ↓ fetch("http://fastapi:8000/cv/optimize", { headers: { "X-User-Id": userId } })
FastAPI                         ← receives trusted user_id
```

## Step 1 — Add env variable in the frontend

In `frontend/.env.local`, add:
```
BACKEND_URL=http://localhost:8000
```

> Never use NEXT_PUBLIC_ prefix — this must stay server-side only.

---

## Step 2 — Create the 3 Next.js API routes

### `frontend/src/app/api/jobs/parse/route.ts`
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${process.env.BACKEND_URL}/jobs/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": user.id,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

---

### `frontend/src/app/api/cv/optimize/route.ts`
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${process.env.BACKEND_URL}/cv/optimize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": user.id,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

---

### `frontend/src/app/api/cv/tasks/[taskId]/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const res = await fetch(`${process.env.BACKEND_URL}/tasks/${params.taskId}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

---

## Step 3 — Update FastAPI security

Replace the content of `scraper-job/app/core/security.py` with:

```python
import logging
from fastapi import Header, HTTPException, status

logger = logging.getLogger(__name__)


def get_current_user_id(x_user_id: str = Header(...)) -> str:
    """
    Extracts the user ID from the X-User-Id header.
    This header is set by the Next.js proxy after validating the Supabase session.
    Never trust this header from external sources — FastAPI must not be publicly exposed.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header",
        )
    return x_user_id
```

---

## Step 4 — Re-add auth on FastAPI endpoints

In `scraper-job/app/api/jobs.py`, restore:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user_id

@router.post("/parse", response_model=JobParseResponse)
async def parse_job(
    body: JobParseRequest,
    user_id: str = Depends(get_current_user_id),
):
```

In `scraper-job/app/api/cv.py`, restore:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user_id

@router.post("/optimize", response_model=CVOptimizeResponse, status_code=status.HTTP_202_ACCEPTED)
async def optimize_cv(
    body: CVOptimizeRequest,
    user_id: str = Depends(get_current_user_id),
):
```

---

## Step 5 — Rebuild

```bash
docker compose up --build
```

---

## How to call the API from the frontend

```typescript
// Parse a job offer
const res = await fetch("/api/jobs/parse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://jobs.lever.co/..." }),
});

// Optimize CV
const res = await fetch("/api/cv/optimize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ job_url: "https://jobs.lever.co/..." }),
});
const { task_id } = await res.json();

// Poll task status
const status = await fetch(`/api/cv/tasks/${task_id}`).then(r => r.json());
```

---

## Important notes
- Read `CLAUDE.md` before starting
- FastAPI must NOT be publicly exposed — only Next.js should call it
- Never use `NEXT_PUBLIC_BACKEND_URL`
- Use `createClient()` from `@/lib/supabase/server` (not the browser client)
