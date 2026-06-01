import { getAnalysisHistory } from "@/lib/jobs/server";
import { JobAnalysisContent } from "@/components/pages/jobs";

// Auth is enforced in proxy.ts, so the page renders immediately and the
// analysis history streams into the list's Suspense boundary.
export default function JobsPage() {
  // Not awaited: streams into the history list's Suspense boundary.
  const historyPromise = getAnalysisHistory();

  return <JobAnalysisContent historyPromise={historyPromise} />;
}
