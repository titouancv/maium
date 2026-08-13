import { Suspense } from "react";
import { getAnalysisById, getAnalysisStatusEvents } from "@/lib/jobs/server";
import { JobAnalysisDetailContent } from "@/components/pages/jobs";
import { CompanyContactsLoader } from "@/components/pages/jobs/collections/CompanyContactsLoader";

export default async function JobAnalysisPage({
  params,
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;
  const analysisPromise = getAnalysisById(analysisId);

  return (
    <JobAnalysisDetailContent
      analysisPromise={analysisPromise}
      eventsPromise={getAnalysisStatusEvents(analysisId)}
      contacts={
        <Suspense fallback={null}>
          <CompanyContactsLoader analysisPromise={analysisPromise} />
        </Suspense>
      }
    />
  );
}
