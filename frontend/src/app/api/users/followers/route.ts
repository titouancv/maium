import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const pseudo = request.nextUrl.searchParams.get("pseudo");
    if (!pseudo) {
      return NextResponse.json({ error: "Missing pseudo" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: target } = await admin.from("users").select("id").eq("pseudo", pseudo).single();
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data, error } = await admin
      .from("user_follows")
      .select("follower:follower_id(pseudo, first_name, last_name, location)")
      .eq("followed_id", target.id);

    if (error) throw error;

    const users = (data ?? []).map((row: any) => row.follower).filter(Boolean);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/users/followers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
