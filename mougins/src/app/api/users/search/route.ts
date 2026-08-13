import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const authClient = await createClient();
  const {
    data: { user: currentUser },
  } = await authClient.auth.getUser();

  const supabase = createAdminClient();

  const pattern = `%${q}%`;

  let query = supabase
    .from("users")
    .select("id, pseudo, first_name, last_name, location, profile_photo, gender")
    .or(
      `pseudo.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},location.ilike.${pattern}`,
    )
    .eq("onboarding_completed", true)
    .limit(10);

  if (currentUser) {
    query = query.neq("id", currentUser.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  const rows = data ?? [];

  let followedSet = new Set<string>();
  if (currentUser && rows.length > 0) {
    const { data: follows } = await supabase
      .from("user_follows")
      .select("followed_id")
      .eq("follower_id", currentUser.id)
      .in(
        "followed_id",
        rows.map((row) => row.id),
      );
    followedSet = new Set((follows ?? []).map((row) => row.followed_id));
  }

  const users = rows.map((row) => ({
    pseudo: row.pseudo,
    first_name: row.first_name,
    last_name: row.last_name,
    location: row.location,
    profile_photo: row.profile_photo,
    gender: row.gender,
    is_following: followedSet.has(row.id),
  }));

  return NextResponse.json({ users });
}
