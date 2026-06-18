import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;

    // RLS also restricts deletes to the author; the explicit filter keeps the
    // intent clear and avoids a no-op succeeding silently for a foreign story.
    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/stories/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
