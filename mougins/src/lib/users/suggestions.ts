import { createClient } from "@/lib/supabase/server";
import type { SuggestedUser } from "@/types";

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
