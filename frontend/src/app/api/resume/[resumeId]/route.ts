import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch, BACKEND_ROUTES, toNextResponse } from "@/lib/server/authenticated-fetch";
import type { ResumeResponse, DeleteResumeResponse } from "@/lib/server/resume-types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ resumeId: string }> };

function validateResumeId(resumeId: string): boolean {
  return Boolean(resumeId) && /^[a-zA-Z0-9_-]+$/.test(resumeId);
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { resumeId } = await params;

  if (!validateResumeId(resumeId)) {
    return NextResponse.json({ error: "Invalid resumeId" }, { status: 400 });
  }

  const result = await authenticatedFetch<ResumeResponse>(BACKEND_ROUTES.RESUME_BY_ID(resumeId));
  return toNextResponse(result);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { resumeId } = await params;

  if (!validateResumeId(resumeId)) {
    return NextResponse.json({ error: "Invalid resumeId" }, { status: 400 });
  }

  const result = await authenticatedFetch<DeleteResumeResponse>(
    BACKEND_ROUTES.RESUME_BY_ID(resumeId),
    { method: "DELETE" },
  );

  return toNextResponse(result);
}
