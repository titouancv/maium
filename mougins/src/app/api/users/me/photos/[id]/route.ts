import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { deletePhoto } from "@/lib/users/gallery";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { id } = await params;
    await deletePhoto(supabase, user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/users/me/photos/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
