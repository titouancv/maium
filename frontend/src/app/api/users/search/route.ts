import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pattern = `%${q}%`;

  const { data, error } = await supabase
    .from("users")
    .select("pseudo, first_name, last_name, location")
    .or(
      `pseudo.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},location.ilike.${pattern}`,
    )
    .eq("onboarding_completed", true)
    .limit(10);

  if (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ users: data ?? [] });
}
