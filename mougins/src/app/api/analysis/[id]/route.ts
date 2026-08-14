import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  deleteAnalysis,
  getAnalysisJobById,
  updateAnalysisTracking,
} from "@/lib/jobs/server";
import { UpdateAnalysisTrackingSchema } from "@/lib/validators/job";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const raw = await request.text();
  const body = ((): unknown => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();
  const parsed = UpdateAnalysisTrackingSchema.safeParse(body);
  if (!parsed.success) {
    console.error(
      "[PATCH /api/analysis/:id] rejected body",
      raw,
      parsed.error.issues,
    );
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const updated = await updateAnalysisTracking(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("[PATCH /api/analysis/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const deleted = await deleteAnalysis(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("[DELETE /api/analysis/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
