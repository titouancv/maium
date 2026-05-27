import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch, BACKEND_ROUTES, toNextResponse } from "@/lib/server/authenticated-fetch";
import type { AnalyzeResumeResponse } from "@/lib/server/resume-types";

export const dynamic = "force-dynamic";

const AnalyzeResumeSchema = z.object({
  jobUrl: z.string().url({ message: "jobUrl must be a valid URL" }),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AnalyzeResumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await authenticatedFetch<AnalyzeResumeResponse>(BACKEND_ROUTES.RESUME_ANALYZE, {
    method: "POST",
    body: parsed.data,
    retry: false,
  });

  return toNextResponse(result);
}
