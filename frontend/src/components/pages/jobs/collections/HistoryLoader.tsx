"use client";

import { use } from "react";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisHistoryList } from "./AnalysisHistoryList";

interface HistoryLoaderProps {
  historyPromise: Promise<AnalysisListItem[]>;
}

/** Unwraps the streamed analysis history inside a Suspense boundary. */
export function HistoryLoader({ historyPromise }: HistoryLoaderProps) {
  const history = use(historyPromise);
  return <AnalysisHistoryList history={history} />;
}
