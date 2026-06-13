import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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
