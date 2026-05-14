import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const { firstName, lastName, pseudo, dob } = parsed.data;

    const { error: dbError } = await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName, pseudo, dob })
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
