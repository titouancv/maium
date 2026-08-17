import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateAnonId,
  hasUsedFreeAnalysis,
  markFreeAnalysisUsed,
} from "@/lib/auth/anonSession";
import { getClientIp } from "@/lib/rateLimit";
import { AnalyzeJobRequestSchema } from "@/lib/validators/job";
import { isAnonUnderQuota, isUnderRateLimit, incrementUsage } from "@/lib/jobs/usage";
import { runAnalysisPipeline } from "@/lib/jobs/pipeline";
import { ANON_SESSION_MAX_AGE_S } from "@/constants";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const parsed = AnalyzeJobRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const owner = user
    ? await resolveUserOwner(user.id)
    : await resolveAnonOwner(req, parsed.data.cvExtraction);

  if (owner instanceof NextResponse) return owner;

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("analysis_jobs")
    .insert({
      ...owner.columns,
      source_url:
        parsed.data.mode === "url"
          ? parsed.data.jobUrl
          : (parsed.data.sourceUrl ?? null),
      job_text: parsed.data.mode === "text" ? parsed.data.jobText : null,
      locale: parsed.data.locale,
      status: "queued",
      progress: 0,
    })
    .select("id")
    .single();

  if (error || !job) {
    console.error("[POST /api/analyze-job] insert failed", error);
    return NextResponse.json(
      { error: "Failed to queue analysis" },
      { status: 500 },
    );
  }

  await owner.onQueued();

  after(() => runAnalysisPipeline(job.id));

  return NextResponse.json(
    { analysisId: job.id, status: "queued" },
    { status: 202 },
  );
}

interface Owner {
  columns: Record<string, unknown>;
  onQueued: () => Promise<void>;
}

async function resolveUserOwner(userId: string): Promise<Owner | NextResponse> {
  if (!(await isUnderRateLimit(userId))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return {
    columns: { user_id: userId, cv_extraction: null },
    onQueued: () => incrementUsage(userId),
  };
}

async function resolveAnonOwner(
  req: NextRequest,
  cvExtraction: unknown,
): Promise<Owner | NextResponse> {
  const quotaExhausted = NextResponse.json(
    { error: "anon_quota_exhausted" },
    { status: 402 },
  );

  if (await hasUsedFreeAnalysis()) return quotaExhausted;

  if (!cvExtraction) {
    return NextResponse.json({ error: "Missing cvExtraction" }, { status: 400 });
  }

  const clientIp = getClientIp(req.headers);
  if (!clientIp) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const anonId = await getOrCreateAnonId();
  if (!(await isAnonUnderQuota({ anonId, clientIp }))) return quotaExhausted;

  const expiresAt = new Date(
    Date.now() + ANON_SESSION_MAX_AGE_S * 1000,
  ).toISOString();

  return {
    columns: {
      user_id: null,
      anon_id: anonId,
      cv_extraction: cvExtraction,
      client_ip: clientIp,
      expires_at: expiresAt,
    },
    onQueued: markFreeAnalysisUsed,
  };
}
