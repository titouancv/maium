import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false }, { status: 204 });
    }

    const { profileId } = await request.json();
    if (!profileId || typeof profileId !== "string") {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    if (profileId === user.id) {
      return NextResponse.json({ success: false }, { status: 204 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("profile_views")
      .insert({ profile_id: profileId, viewer_id: user.id });

    if (error && error.code !== "23505") throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users/view]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
