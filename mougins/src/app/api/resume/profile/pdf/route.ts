import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import {
  buildProfileResumePdfData,
  renderResumePdf,
  resolveTemplate,
  pdfResponse,
} from "@/lib/resume";
import { ResumeJsonInputSchema } from "@/lib/validators/job";

// react-pdf renders in Node (not Edge); pin the runtime explicitly.
export const runtime = "nodejs";

/**
 * Renders a CV PDF built purely from the authenticated user's profile — no job
 * analysis required. The template can be picked via `?template=`.
 */
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

/**
 * Renders the profile CV from a user-edited `resume_json` carried in the body
 * (the resume editor's draft). The header (name, contact, social links) is
 * still taken from the profile; the edits are used for this render only and are
 * never persisted.
 */
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
