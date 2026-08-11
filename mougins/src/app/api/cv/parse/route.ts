import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAnonRateLimit, getClientIp } from "@/lib/rateLimit";
import { extractCvMarkdown, parseCvToProfile } from "@/lib/cv";
import {
  CV_ACCEPTED_MIME_TYPES,
  CV_MAX_BYTES,
  CV_PARSE_PER_IP_PER_DAY,
  DAY_MS,
} from "@/constants";

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
 * Because it is anonymous *and* costs money (one OCR call + one LLM call),
 * anonymous callers are rate-limited per IP. Signed-in users skip the limiter:
 * they are already accountable, and re-importing a CV is a legitimate thing to
 * do repeatedly while fixing a profile.
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

    if (!user) {
      const clientIp = getClientIp(request);
      // No attributable IP means no way to enforce a per-caller limit, so the
      // request cannot be served anonymously.
      if (!clientIp) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const allowed = await checkAnonRateLimit({
        operation: "cv_parse",
        clientIp,
        limit: CV_PARSE_PER_IP_PER_DAY,
        windowMs: DAY_MS,
      });
      if (!allowed) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
    }

    // Reject on the declared size before `formData()` buffers the whole body.
    // The real check below still runs — this header is client-controlled.
    const declaredSize = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > CV_MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

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
