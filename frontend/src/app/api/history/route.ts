import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getAnalysisHistory } from "@/lib/jobs/server";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const history = await getAnalysisHistory();
  return NextResponse.json({ history });
}
