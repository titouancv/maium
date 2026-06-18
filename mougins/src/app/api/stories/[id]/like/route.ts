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
    const { error } = await supabase
      .from("story_likes")
      .upsert(
        { story_id: id, liker_id: user.id },
        { onConflict: "story_id,liker_id", ignoreDuplicates: true },
      );

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/stories/[id]/like]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;
    const { error } = await supabase
      .from("story_likes")
      .delete()
      .eq("story_id", id)
      .eq("liker_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/stories/[id]/like]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
