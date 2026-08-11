import { NextRequest, NextResponse } from "next/server";
import { getAnalysisJobById } from "@/lib/jobs/server";

/**
 * Status of a running analysis, polled by the progress UI.
 *
 * No auth gate of its own: `getAnalysisJobById` returns the row only to its
 * owner — a signed-in user or a browser holding the matching `anon_id` cookie —
 * so a caller who doesn't own it gets the same 404 as a caller asking for an id
 * that doesn't exist.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = await getAnalysisJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    currentStep: job.current_step,
    progress: job.progress,
    analysisId: job.analysis_id,
    error: job.error_message,
  });
}
