import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { AddPhotoSchema, ReorderPhotosSchema } from "@/lib/validators/user";
import { GALLERY_FULL, GALLERY_INVALID_ORDER, addPhoto, reorderPhotos } from "@/lib/users/gallery";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const parsed = AddPhotoSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    try {
      const photo = await addPhoto(supabase, user.id, parsed.data);
      return NextResponse.json(photo, { status: 201 });
    } catch (error) {
      if ((error as Error)?.message === GALLERY_FULL) {
        return NextResponse.json({ error: GALLERY_FULL }, { status: 422 });
      }
      throw error;
    }
  } catch (error) {
    console.error("[POST /api/users/me/photos]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const parsed = ReorderPhotosSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    try {
      await reorderPhotos(supabase, user.id, parsed.data.order);
      return NextResponse.json({ success: true });
    } catch (error) {
      if ((error as Error)?.message === GALLERY_INVALID_ORDER) {
        return NextResponse.json(
          { error: GALLERY_INVALID_ORDER },
          { status: 400 },
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[PATCH /api/users/me/photos]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
