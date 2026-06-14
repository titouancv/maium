import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface ApiUserContext {
  user: User;
  supabase: ServerClient;
}

/**
 * Resolve the authenticated user for a route handler.
 *
 * Returns the `{ user, supabase }` context on success, or a ready-to-return
 * `401` {@link NextResponse} when no user is signed in. Callers narrow with
 * `instanceof NextResponse`:
 *
 * ```ts
 * const auth = await requireApiUser();
 * if (auth instanceof NextResponse) return auth;
 * const { user, supabase } = auth;
 * ```
 *
 * Always uses `supabase.auth.getUser()` (server round-trip), never
 * `getSession()`.
 */
export async function requireApiUser(): Promise<ApiUserContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}
