import { NextRequest, NextResponse } from "next/server";
import { SNOOZE_EMAIL_BATCH_LIMIT } from "@/constants";
import { sendPendingSnoozeEmails } from "@/lib/email";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await sendPendingSnoozeEmails(SNOOZE_EMAIL_BATCH_LIMIT);
    return NextResponse.json({ sent }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/cron/notification-emails]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
