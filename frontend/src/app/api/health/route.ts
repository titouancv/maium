import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("users").select("count").limit(1);
    if (error) throw error;
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[health]", error);
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
}
