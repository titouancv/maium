import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("value");
  if (!value || value.length < 3) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("pseudo", value);

  if (error) {
    return NextResponse.json({ available: false }, { status: 500 });
  }

  return NextResponse.json({ available: count === 0 });
}
