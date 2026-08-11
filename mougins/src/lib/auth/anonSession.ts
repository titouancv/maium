import { cookies } from "next/headers";
import {
  ANON_SESSION_COOKIE,
  ANON_SESSION_MAX_AGE_S,
  ANON_USED_COOKIE,
  ANON_USED_MAX_AGE_S,
} from "@/constants";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

/**
 * Identity of a signed-out visitor, or `null` if they have none yet.
 *
 * **Holding this cookie is the entire access right** to the `analysis_jobs` /
 * `analyses` / `optimized_resumes` rows carrying the same `anon_id`. Those rows
 * are never exposed to the `anon` Postgres role — every read goes through the
 * service-role client behind a check against this value.
 */
export async function getAnonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ANON_SESSION_COOKIE)?.value ?? null;
}

/** Read the visitor's id, minting and setting one if this is their first run. */
export async function getOrCreateAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(ANON_SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(ANON_SESSION_COOKIE, id, {
    ...COOKIE_OPTIONS,
    maxAge: ANON_SESSION_MAX_AGE_S,
  });
  return id;
}

/**
 * Whether this browser has already spent its one free analysis.
 *
 * Kept in its own cookie, outliving the session cookie: the free run is a
 * lifetime allowance, while `anon_id` only needs to live as long as the results
 * it can reach.
 */
export async function hasUsedFreeAnalysis(): Promise<boolean> {
  const store = await cookies();
  return store.get(ANON_USED_COOKIE)?.value === "1";
}

/** Mark the free analysis as spent. */
export async function markFreeAnalysisUsed(): Promise<void> {
  const store = await cookies();
  store.set(ANON_USED_COOKIE, "1", {
    ...COOKIE_OPTIONS,
    maxAge: ANON_USED_MAX_AGE_S,
  });
}

/** Drop both cookies — called once an account has claimed the session. */
export async function clearAnonSession(): Promise<void> {
  const store = await cookies();
  store.delete(ANON_SESSION_COOKIE);
  store.delete(ANON_USED_COOKIE);
}
