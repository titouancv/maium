import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnalyzeJobSchema } from "@/lib/validators/job";
import { isUnderRateLimit, incrementUsage } from "@/lib/jobs/usage";
import { runAnalysisPipeline } from "@/lib/jobs/pipeline";

// The pipeline runs in `after()`; give it room (Vercel Pro allows up to 300s).
// Beyond this, move the pipeline to an Edge Function + pg_cron worker.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = AnalyzeJobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!(await isUnderRateLimit(user.id))) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const admin = createAdminClient();
  const insertPayload =
    parsed.data.mode === "url"
      ? { user_id: user.id, source_url: parsed.data.jobUrl, status: "queued", progress: 0 }
      : { user_id: user.id, job_text: parsed.data.jobText, status: "queued", progress: 0 };

  const { data: job, error } = await admin
    .from("analysis_jobs")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: "Failed to queue analysis" },
      { status: 500 },
    );
  }

  await incrementUsage(user.id);

  // Run the pipeline after the response is sent.
  after(() => runAnalysisPipeline(job.id));

  return NextResponse.json(
    { analysisId: job.id, status: "queued" },
    { status: 202 },
  );
}
