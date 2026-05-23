import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const res = await fetch(
    `${process.env.BACKEND_URL}/tasks/${params.taskId}`
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
