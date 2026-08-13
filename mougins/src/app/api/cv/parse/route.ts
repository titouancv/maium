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

export const maxDuration = 60;

type AcceptedMimeType = (typeof CV_ACCEPTED_MIME_TYPES)[number];

function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const clientIp = user ? null : getClientIp(request);
    if (!user && !clientIp) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    if (clientIp) {
      const allowed = await checkAnonRateLimit({
        operation: "cv_parse",
        clientIp,
        limit: CV_PARSE_PER_IP_PER_DAY,
        windowMs: DAY_MS,
      });
      if (!allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 },
        );
      }
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
