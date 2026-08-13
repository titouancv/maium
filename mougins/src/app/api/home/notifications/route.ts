import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/users";

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
