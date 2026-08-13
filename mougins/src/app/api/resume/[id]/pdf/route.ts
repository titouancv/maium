import { NextRequest, NextResponse } from "next/server";
import {
  buildResumePdfData,
  renderResumePdf,
  resolveTemplate,
  pdfResponse,
} from "@/lib/resume";
import { ResumeJsonInputSchema } from "@/lib/validators/job";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const template = resolveTemplate(req.nextUrl.searchParams.get("template"));

  const data = await buildResumePdfData(id, req.nextUrl.origin);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template);
  return pdfResponse(pdf, data.fullName);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = (await req.json().catch(() => null)) as {
    resume_json?: unknown;
    template?: string;
  } | null;
  const parsed = ResumeJsonInputSchema.safeParse(body?.resume_json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const template = resolveTemplate(body?.template ?? null);

  const { id } = await params;
  const data = await buildResumePdfData(id, req.nextUrl.origin, parsed.data);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template);
  return pdfResponse(pdf, data.fullName);
}
