import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getResumeById } from "@/lib/jobs/server";

/**
 * An optimized resume. Readable by its owner, signed in or not —
 * `getResumeById` does the ownership check, so a non-owner sees the same 404
 * as a missing id. Deleting still requires an account (see DELETE below).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getResumeById(id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { id } = await params;
  // RLS scopes the update to the owner; soft delete only.
  const { error } = await supabase
    .from("optimized_resumes")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
