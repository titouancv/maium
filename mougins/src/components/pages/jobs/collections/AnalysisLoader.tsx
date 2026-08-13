"use client";

import { use, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Title } from "@/components/ui";
import type { AnalysisListItem, AnalysisStatusEvent } from "@/types/job";
import { AnalysisView } from "./AnalysisView";
import { ApplicationTracker } from "./ApplicationTracker";
import { StatusTimeline } from "./StatusTimeline";

interface AnalysisLoaderProps {
  analysisPromise: Promise<AnalysisListItem | null>;
  eventsPromise: Promise<AnalysisStatusEvent[]>;
  contacts: ReactNode;
}

export function AnalysisLoader({
  analysisPromise,
  eventsPromise,
  contacts,
}: AnalysisLoaderProps) {
  const t = useTranslations("jobs");
  const analysis = use(analysisPromise);
  const events = use(eventsPromise);

  if (!analysis) notFound();

  const heading =
    [analysis.job?.company, analysis.job?.title].filter(Boolean).join(" • ") ||
    t("untitledJob");

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <Title label={heading} size="h2" />
      <AnalysisView
        analysis={analysis}
        contacts={contacts}
        tracking={
          <div className="flex flex-col gap-6">
            <ApplicationTracker analysis={analysis} />
            <StatusTimeline events={events} createdAt={analysis.created_at} />
          </div>
        }
      />
    </div>
  );
}
