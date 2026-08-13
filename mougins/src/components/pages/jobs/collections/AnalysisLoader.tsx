"use client";

import { use, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui";
import type { AnalysisListItem, AnalysisStatusEvent } from "@/types/job";
import { AnalysisView } from "./AnalysisView";
import { ApplicationStatusSelector } from "./ApplicationStatusSelector";
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

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AnalysisView
        analysis={analysis}
        contacts={contacts}
        statusBar={<ApplicationStatusSelector analysis={analysis} />}
        tracking={
          <div className="grid w-full min-w-0 grid-cols-1 gap-10 md:grid-cols-3">
            <div className="min-w-0 md:col-span-2">
              <ApplicationTracker analysis={analysis} />
            </div>
            <Section title={t("detail.tracking.timeline")}>
              <StatusTimeline events={events} createdAt={analysis.created_at} />
            </Section>
          </div>
        }
      />
    </div>
  );
}
