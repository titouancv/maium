import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateUserSchema } from "@/lib/validators/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, firstName, lastName, pseudo, dob } = parsed.data;
    const dobISO = new Date(dob).toISOString().slice(0, 10);
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      throw authError;
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }

    const { data: userData, error: dbError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        pseudo,
        dob: dobISO,
      })
      .select("id")
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      throw dbError;
    }

    return NextResponse.json({ id: userData.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
