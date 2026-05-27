import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Backend route constants
// ---------------------------------------------------------------------------

export const BACKEND_ROUTES = {
  RESUME_ANALYZE: "/resume/analyze",
  RESUME_STATUS: (trackingId: string) => `/resume/status/${trackingId}`,
  RESUME_BY_ID: (resumeId: string) => `/resume/${resumeId}`,
  RESUME_HISTORY: "/resume/history",
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

export type AuthFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  retry?: boolean;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error("BACKEND_URL env var is not set");
  return url;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Backend timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  retry: boolean,
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, init, timeoutMs);
  } catch (err) {
    if (!retry) throw err;
    // Single retry on network/timeout errors only
    return await fetchWithTimeout(url, init, timeoutMs);
  }
}

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

export async function authenticatedFetch<T>(
  path: string,
  options: AuthFetchOptions = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS, retry = false } = options;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // getSession() reads from cookies — backend independently validates the JWT.
  if (!session) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const url = `${getBackendUrl()}${path}`;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      "X-User-Id": session.user.id,
    },
    cache: "no-store",
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };

  let res: Response;
  try {
    res = await fetchWithRetry(url, init, timeoutMs, retry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error(`[authenticatedFetch] ${method} ${path} failed:`, message);
    return { ok: false, error: message, status: 503 };
  }

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    console.error(
      `[authenticatedFetch] ${method} ${path} — non-JSON response (${res.status})`,
    );
    return { ok: false, error: "Invalid backend response", status: 502 };
  }

  if (!res.ok) {
    const backendError = (data as { error?: string }).error ?? "Backend error";
    console.error(`[authenticatedFetch] ${method} ${path} — ${res.status}:`, backendError);
    return { ok: false, error: backendError, status: res.status };
  }

  return { ok: true, data, status: res.status };
}

// ---------------------------------------------------------------------------
// Route helper — converts ApiResult to NextResponse
// ---------------------------------------------------------------------------

export function toNextResponse<T>(result: ApiResult<T>): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: result.status });
}
