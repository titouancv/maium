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

export async function getAnonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ANON_SESSION_COOKIE)?.value ?? null;
}

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

export async function hasUsedFreeAnalysis(): Promise<boolean> {
  const store = await cookies();
  return store.get(ANON_USED_COOKIE)?.value === "1";
}

export async function markFreeAnalysisUsed(): Promise<void> {
  const store = await cookies();
  store.set(ANON_USED_COOKIE, "1", {
    ...COOKIE_OPTIONS,
    maxAge: ANON_USED_MAX_AGE_S,
  });
}

export async function clearAnonSession(): Promise<void> {
  const store = await cookies();
  store.delete(ANON_SESSION_COOKIE);
  store.delete(ANON_USED_COOKIE);
}
