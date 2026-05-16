import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateUserSchema } from "@/lib/validators/user";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      pseudo,
      dob,
      onboardingCompleted,
      professionalExperiences,
      educationalExperiences,
    } = parsed.data;

    const updates: Record<string, unknown> = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (pseudo !== undefined) updates.pseudo = pseudo;
    if (dob !== undefined) updates.dob = dob;
    if (onboardingCompleted !== undefined)
      updates.onboarding_completed = onboardingCompleted;
    if (professionalExperiences !== undefined)
      updates.professional_experiences = professionalExperiences;
    if (educationalExperiences !== undefined)
      updates.educational_experiences = educationalExperiences;

    const { error: dbError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "Pseudo already in use" }, { status: 409 });
      }
      throw dbError;
    }

    return NextResponse.json({ id: user.id }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/users/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { error: dbError } = await admin
      .from("users")
      .delete()
      .eq("id", user.id);

    if (dbError) throw dbError;

    const { error: adminError } = await admin.auth.admin.deleteUser(user.id);
    if (adminError) throw adminError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/users/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
