import { NextRequest, NextResponse } from "next/server";
import { getAnalysisById } from "@/lib/jobs/server";

/**
 * A finished analysis, for the signed-out result screen (a signed-in user gets
 * theirs from `/api/history`).
 *
 * Ownership is enforced inside `getAnalysisById`, so a caller who doesn't own
 * the analysis is indistinguishable from one asking for a missing id.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const analysis = await getAnalysisById(id);
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(analysis);
}
