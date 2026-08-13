import { NextResponse } from "next/server";
import { markNotificationsRead } from "@/lib/users";

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
