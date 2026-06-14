import { NextResponse } from "next/server";
import { markNotificationsRead } from "@/lib/users";

// Mark all of the current user's unread notifications as read. Called when the
// home Notifications overlay opens (the badge clears). `markNotificationsRead`
// gates on the authenticated user (no-op when signed out).
export async function POST() {
  try {
    await markNotificationsRead();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/home/notifications/read]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
