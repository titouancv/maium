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
    .select("pseudo, first_name, last_name, location")
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

  return NextResponse.json({ users: data ?? [] });
}
