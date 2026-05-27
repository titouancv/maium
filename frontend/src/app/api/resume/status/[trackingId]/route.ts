import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch, BACKEND_ROUTES, toNextResponse } from "@/lib/server/authenticated-fetch";
import type { ResumeStatusResponse } from "@/lib/server/resume-types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ trackingId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { trackingId } = await params;

  if (!trackingId || !/^[a-zA-Z0-9_-]+$/.test(trackingId)) {
    return NextResponse.json({ error: "Invalid trackingId" }, { status: 400 });
  }

  const result = await authenticatedFetch<ResumeStatusResponse>(
    BACKEND_ROUTES.RESUME_STATUS(trackingId),
  );

  return toNextResponse(result);
}
