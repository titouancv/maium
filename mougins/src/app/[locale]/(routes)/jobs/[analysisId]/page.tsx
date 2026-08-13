import { Suspense } from "react";
import { getAnalysisById } from "@/lib/jobs/server";
import {
  CompanyContactsSkeleton,
  JobAnalysisDetailContent,
} from "@/components/pages/jobs";
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
      contacts={
        <Suspense fallback={<CompanyContactsSkeleton />}>
          <CompanyContactsLoader analysisPromise={analysisPromise} />
        </Suspense>
      }
    />
  );
}
