import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  buildProfileResumePdfData,
  renderResumePdf,
  resolveTemplate,
  pdfResponse,
} from "@/lib/resume";
import { ResumeJsonInputSchema } from "@/lib/validators/job";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const template = resolveTemplate(req.nextUrl.searchParams.get("template"));

  const data = await buildProfileResumePdfData(req.nextUrl.origin);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template);
  return pdfResponse(pdf, data.fullName);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => null)) as {
    resume_json?: unknown;
    template?: string;
  } | null;
  const parsed = ResumeJsonInputSchema.safeParse(body?.resume_json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const template = resolveTemplate(body?.template ?? null);

  const data = await buildProfileResumePdfData(req.nextUrl.origin, parsed.data);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template);
  return pdfResponse(pdf, data.fullName);
}
