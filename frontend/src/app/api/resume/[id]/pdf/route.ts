import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildResumePdfData,
  renderResumePdf,
  resolveTemplate,
  pdfResponse,
} from "@/lib/resume";
import { ResumeJsonInputSchema } from "@/lib/validators/job";

// react-pdf renders in Node (not Edge); pin the runtime explicitly.
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const template = resolveTemplate(req.nextUrl.searchParams.get("template"));

  const data = await buildResumePdfData(id, req.nextUrl.origin);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = await renderResumePdf(data, template);
  return pdfResponse(pdf, data.fullName);
}

/**
 * Renders the PDF from a user-edited `resume_json` carried in the body. The
 * edits are used for this render only — nothing is written to the database.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
