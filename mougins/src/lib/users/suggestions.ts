import { createClient } from "@/lib/supabase/server";
import type { SuggestedUser } from "@/types";

/**
 * Connection suggestions for the home dashboard: the most-followed profiles the
 * current user does not already follow. Resolved by the `get_suggested_users`
 * RPC (it reads the caller from `auth.uid()`), so callers never pass an id.
 * For a signed-out caller the RPC degenerates to "the most-followed profiles",
 * powering the popular-accounts list on the public home page.
 * Returns `[]` on error — suggestions are non-critical.
 */
export async function getSuggestedUsers(
  limit = 12,
): Promise<SuggestedUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_suggested_users", {
    p_limit: limit,
  });

  if (error) {
    console.error("[getSuggestedUsers]", error);
    return [];
  }

  return (data ?? []) as SuggestedUser[];
}
