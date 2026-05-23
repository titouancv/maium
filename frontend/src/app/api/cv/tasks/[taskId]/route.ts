import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const res = await fetch(
    `${process.env.BACKEND_URL}/tasks/${taskId}`
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
