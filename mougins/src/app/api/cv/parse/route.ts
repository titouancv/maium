import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractCvMarkdown, parseCvToProfile } from "@/lib/cv";
import { CV_ACCEPTED_MIME_TYPES, CV_MAX_BYTES } from "@/constants";

// OCR + one LLM call; well under the default limit for a one-page CV, but a
// long scanned PDF can take a while.
export const maxDuration = 60;

type AcceptedMimeType = (typeof CV_ACCEPTED_MIME_TYPES)[number];

function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}

/**
 * OCRs an uploaded CV (PDF or image) and returns it as a profile draft shaped
 * like the body `PATCH /api/users/me` accepts.
 *
 * Auth is **optional**, like `/api/users/search` and `/api/users/view`: the
 * same endpoint serves the signup wizard and the anonymous `/analyze` funnel.
 * A user id, when there is one, only tags the `llm_logs` audit rows.
 *
 * Nothing is persisted — no Storage bucket, no database row. The uploaded bytes
 * live in memory for the length of the request and the extracted draft is
 * handed straight back to the caller, who decides what to do with it.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!isAcceptedMimeType(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 },
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (file.size > CV_MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const userId = user?.id ?? null;

    const markdown = await extractCvMarkdown({
      data,
      mimeType: file.type,
      userId,
    });
    if (!markdown) {
      return NextResponse.json(
        { error: "No text found in document" },
        { status: 422 },
      );
    }

    const profile = await parseCvToProfile(markdown, userId);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[POST /api/cv/parse]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
