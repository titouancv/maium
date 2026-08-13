import { NextRequest, NextResponse } from "next/server";
import { getAnalysisById } from "@/lib/jobs/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const analysis = await getAnalysisById(id);
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(analysis);
}
