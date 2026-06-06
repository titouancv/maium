import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildResumePdfData, renderResumePdf } from "@/lib/resume";
import { RESUME_TEMPLATES, type ResumeTemplate } from "@/types/job";

// react-pdf renders in Node (not Edge); pin the runtime explicitly.
export const runtime = "nodejs";

function resolveTemplate(value: string | null): ResumeTemplate {
  return RESUME_TEMPLATES.includes(value as ResumeTemplate)
    ? (value as ResumeTemplate)
    : "finance";
}

/** Sanitizes a name into an ASCII filename fragment. */
function fileSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "Resume"
  );
}

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
  const filename = `CV_${fileSlug(data.fullName)}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
