import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnalysisHistory } from "@/lib/jobs/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await getAnalysisHistory();
  return NextResponse.json({ history });
}
