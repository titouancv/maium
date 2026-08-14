import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  buildProfileResumePdfData,
  getResumeLabels,
  renderResumePdf,
  resolveResumeLanguage,
  resolveTemplate,
  pdfResponse,
} from "@/lib/resume";
import { ResumeJsonInputSchema } from "@/lib/validators/job";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const template = resolveTemplate(req.nextUrl.searchParams.get("template"));
  const language = resolveResumeLanguage(
    req.nextUrl.searchParams.get("language"),
  );

  const [data, labels] = await Promise.all([
    buildProfileResumePdfData(req.nextUrl.origin),
    getResumeLabels(language),
  ]);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template, labels);
  return pdfResponse(pdf, data.fullName);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as {
    resume_json?: unknown;
    template?: string;
    language?: string;
  } | null;
  const parsed = ResumeJsonInputSchema.safeParse(body?.resume_json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const template = resolveTemplate(body?.template ?? null);
  const language = resolveResumeLanguage(body?.language);

  const [data, labels] = await Promise.all([
    buildProfileResumePdfData(req.nextUrl.origin, parsed.data),
    getResumeLabels(language),
  ]);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template, labels);
  return pdfResponse(pdf, data.fullName);
}
