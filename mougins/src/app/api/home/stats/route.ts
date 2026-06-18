import { NextResponse } from "next/server";
import { getHomeStats } from "@/lib/users";

// Authoritative home dashboard stats, refetched by the client when a
// `home-stats:<userId>` Realtime ping fires. `getHomeStats` already gates on the
// authenticated user (returns zeros when signed out), so no extra auth here.
export async function GET() {
  const stats = await getHomeStats();
  return NextResponse.json(stats);
}
