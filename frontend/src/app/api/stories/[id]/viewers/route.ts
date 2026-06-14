import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getStoryViewers } from "@/lib/stories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Gate on auth so the request carries a JWT (the RPC resolves the caller
    // from it) and unauthenticated requests get a 401 rather than a 403.
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const users = await getStoryViewers(id);
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
