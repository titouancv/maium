import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getStoryViewers } from "@/lib/stories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

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
