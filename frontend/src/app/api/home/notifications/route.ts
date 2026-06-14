import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/users";

// The current user's recent notifications (newest first). `getNotifications`
// gates on the authenticated user (returns [] when signed out), so no extra
// auth here. Fetched by the home Notifications overlay when it opens.
export async function GET() {
  try {
    const notifications = await getNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[GET /api/home/notifications]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
