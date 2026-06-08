import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records that the authenticated viewer looked at `profileId`. Deduped to one
 * row per viewer/profile/day by a unique index (a same-day repeat insert raises
 * 23505, which we treat as success). Anonymous viewers and self-views are
 * silently skipped, so the home "profile views (7d)" stat only counts unique
 * authenticated daily visitors.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Logged-in viewers only — nothing to record for anonymous visitors.
    if (!user) {
      return NextResponse.json({ success: false }, { status: 204 });
    }

    const { profileId } = await request.json();
    if (!profileId || typeof profileId !== "string") {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    // Don't count someone viewing their own profile.
    if (profileId === user.id) {
      return NextResponse.json({ success: false }, { status: 204 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("profile_views")
      .insert({ profile_id: profileId, viewer_id: user.id });

    // 23505 = already viewed today (unique index); treat as a no-op success.
    if (error && error.code !== "23505") throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users/view]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
