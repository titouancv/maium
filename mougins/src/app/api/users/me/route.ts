import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateUserSchema } from "@/lib/validators/user";
import { UNIQUE_VIOLATION, writeProfile } from "@/lib/users/writeProfile";

/**
 * Update the current user's profile. Every field is optional; collections are
 * **replaced** rather than merged.
 *
 * The write itself lives in `writeProfile`, shared with the signup claim that
 * copies an anonymous visitor's CV onto their new account — both must behave
 * identically.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const parsed = UpdateUserSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    try {
      // The RLS-scoped client: the user may only write their own row.
      await writeProfile(supabase, user.id, parsed.data);
    } catch (error) {
      if ((error as { code?: string })?.code === UNIQUE_VIOLATION) {
        return NextResponse.json(
          { error: "Pseudo already in use" },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ id: user.id }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/users/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const admin = createAdminClient();

    const { error: dbError } = await admin.from("users").delete().eq("id", user.id);
    if (dbError) throw dbError;

    const { error: adminError } = await admin.auth.admin.deleteUser(user.id);
    if (adminError) throw adminError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/users/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
