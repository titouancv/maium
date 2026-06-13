import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoryViewers } from "@/lib/stories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const users = await getStoryViewers(id, user.id);
    if (users === null) {
      // Story missing or the requester is not its author.
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/stories/[id]/viewers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
