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
      phone,
      nationality,
      location,
      socialNetworks,
      hobbies,
      personalExperiences,
      skills,
      projects,
    } = parsed.data;

    // 1. Update core user fields
    const coreUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) coreUpdates.first_name = firstName;
    if (lastName !== undefined) coreUpdates.last_name = lastName;
    if (pseudo !== undefined) coreUpdates.pseudo = pseudo;
    if (dob !== undefined) coreUpdates.dob = new Date(dob).toISOString().slice(0, 10);
    if (onboardingCompleted !== undefined) coreUpdates.onboarding_completed = onboardingCompleted;
    if (phone !== undefined) coreUpdates.phone = phone ?? null;
    if (nationality !== undefined) coreUpdates.nationality = nationality ?? null;
    if (location !== undefined) coreUpdates.location = location ?? null;

    if (Object.keys(coreUpdates).length > 0) {
      const { error: dbError } = await supabase
        .from("users")
        .update(coreUpdates)
        .eq("id", user.id);

      if (dbError) {
        if (dbError.code === "23505") {
          return NextResponse.json({ error: "Pseudo already in use" }, { status: 409 });
        }
        throw dbError;
      }
    }

    // 2. Replace experience arrays (delete all of type, then reinsert)
    if (professionalExperiences !== undefined) {
      const { error } = await supabase
        .from("user_experiences")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "professional");
      if (error) throw error;

      if (professionalExperiences.length > 0) {
        const { error: insertError } = await supabase.from("user_experiences").insert(
          professionalExperiences.map((exp, i) => ({
            user_id: user.id,
            type: "professional",
            organization: exp.organization,
            role: exp.role,
            start_period: exp.startPeriod,
            end_period: exp.endPeriod ?? null,
            description: exp.description ?? null,
            website: exp.website ?? null,
            location: exp.location ?? null,
            position: i,
          })),
        );
        if (insertError) throw insertError;
      }
    }

    if (educationalExperiences !== undefined) {
      const { error } = await supabase
        .from("user_experiences")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "educational");
      if (error) throw error;

      if (educationalExperiences.length > 0) {
        const { error: insertError } = await supabase.from("user_experiences").insert(
          educationalExperiences.map((exp, i) => ({
            user_id: user.id,
            type: "educational",
            organization: exp.organization,
            role: exp.role,
            start_period: exp.startPeriod,
            end_period: exp.endPeriod ?? null,
            description: exp.description ?? null,
            website: exp.website ?? null,
            location: exp.location ?? null,
            position: i,
          })),
        );
        if (insertError) throw insertError;
      }
    }

    if (personalExperiences !== undefined) {
      const { error } = await supabase
        .from("user_experiences")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "personal");
      if (error) throw error;

      if (personalExperiences.length > 0) {
        const { error: insertError } = await supabase.from("user_experiences").insert(
          personalExperiences.map((exp, i) => ({
            user_id: user.id,
            type: "personal",
            organization: exp.organization,
            role: exp.role,
            start_period: exp.startPeriod,
            end_period: exp.endPeriod ?? null,
            description: exp.description ?? null,
            website: exp.website ?? null,
            location: exp.location ?? null,
            position: i,
          })),
        );
        if (insertError) throw insertError;
      }
    }

    // 3. Replace simple arrays
    if (skills !== undefined) {
      const { error } = await supabase.from("user_skills").delete().eq("user_id", user.id);
      if (error) throw error;
      if (skills.length > 0) {
        const { error: insertError } = await supabase
          .from("user_skills")
          .insert(skills.map((name, i) => ({ user_id: user.id, name, position: i })));
        if (insertError) throw insertError;
      }
    }

    if (projects !== undefined) {
      const { error } = await supabase.from("user_projects").delete().eq("user_id", user.id);
      if (error) throw error;
      if (projects.length > 0) {
        const { error: insertError } = await supabase
          .from("user_projects")
          .insert(projects.map((url, i) => ({ user_id: user.id, url, position: i })));
        if (insertError) throw insertError;
      }
    }

    if (socialNetworks !== undefined) {
      const { error } = await supabase
        .from("user_social_networks")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      if (socialNetworks.length > 0) {
        const { error: insertError } = await supabase
          .from("user_social_networks")
          .insert(socialNetworks.map((url, i) => ({ user_id: user.id, url, position: i })));
        if (insertError) throw insertError;
      }
    }

    if (hobbies !== undefined) {
      const { error } = await supabase.from("user_hobbies").delete().eq("user_id", user.id);
      if (error) throw error;
      if (hobbies.length > 0) {
        const { error: insertError } = await supabase
          .from("user_hobbies")
          .insert(
            hobbies.map((h, i) => ({
              user_id: user.id,
              title: h.title,
              description: h.description,
              position: i,
            })),
          );
        if (insertError) throw insertError;
      }
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
