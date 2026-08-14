"use client";

import { use, type ReactNode } from "react";
import { notFound } from "next/navigation";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisView } from "./AnalysisView";
import { ApplicationStatusSelector } from "./ApplicationStatusSelector";
import { ApplicationTracker } from "./ApplicationTracker";
import { DeleteAnalysisButton } from "./DeleteAnalysisButton";

interface AnalysisLoaderProps {
  analysisPromise: Promise<AnalysisListItem | null>;
  contacts: ReactNode;
}

export function AnalysisLoader({
  analysisPromise,
  contacts,
}: AnalysisLoaderProps) {
  const analysis = use(analysisPromise);

  if (!analysis) notFound();

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AnalysisView
        analysis={analysis}
        contacts={contacts}
        statusBar={<ApplicationStatusSelector analysis={analysis} />}
        tracking={
          <>
            <ApplicationTracker analysis={analysis} />
            <DeleteAnalysisButton analysisId={analysis.id} />
          </>
        }
      />
    </div>
  );
}
