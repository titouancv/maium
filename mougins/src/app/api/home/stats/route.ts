import { NextResponse } from "next/server";
import { getHomeStats } from "@/lib/users";

export async function GET() {
  const stats = await getHomeStats();
  return NextResponse.json(stats);
}
