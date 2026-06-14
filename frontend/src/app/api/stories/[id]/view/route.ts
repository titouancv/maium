import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;

    // Idempotent: a repeat view is a no-op. RLS guarantees the story is visible.
    const { error } = await supabase
      .from("story_views")
      .upsert(
        { story_id: id, viewer_id: user.id },
        { onConflict: "story_id,viewer_id", ignoreDuplicates: true },
      );

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/stories/[id]/view]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
