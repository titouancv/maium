import { getAnalysisHistory } from "@/lib/jobs/server";
import { JobHistoryContent } from "@/components/pages/jobs";

export default function JobHistoryPage() {
  const historyPromise = getAnalysisHistory();

  return <JobHistoryContent historyPromise={historyPromise} />;
}
