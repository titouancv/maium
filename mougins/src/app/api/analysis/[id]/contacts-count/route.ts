import { NextRequest, NextResponse } from "next/server";
import { getAnalysisById } from "@/lib/jobs/server";
import { getCompanyContactsCount } from "@/lib/jobs/contacts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const analysis = await getAnalysisById(id);
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const company = analysis.job?.company ?? null;
  const count = await getCompanyContactsCount(company);

  return NextResponse.json({ company, count });
}
