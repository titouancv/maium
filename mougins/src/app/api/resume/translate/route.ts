import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { translateResumeJson } from "@/lib/resume";
import { TranslateResumeRequestSchema } from "@/lib/validators/job";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const parsed = TranslateResumeRequestSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const resume_json = await translateResumeJson({
      userId: user.id,
      resumeJson: parsed.data.resume_json,
      language: parsed.data.language,
    });
    return NextResponse.json({ resume_json });
  } catch (error) {
    console.error("[POST /api/resume/translate]", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
