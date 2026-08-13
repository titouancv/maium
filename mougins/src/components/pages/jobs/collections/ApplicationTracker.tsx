"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ANALYSIS_NOTES_SAVE_DEBOUNCE_MS } from "@/constants";
import {
  DateInput,
  InfoMessage,
  Section,
  TextArea,
  Text,
} from "@/components/ui";
import { updateAnalysisTrackingRequest } from "@/lib/jobs/updateTracking";
import { type AnalysisListItem } from "@/types/job";

interface ApplicationTrackerProps {
  analysis: AnalysisListItem;
}

function toTimestamp(value: string | null): number | null {
  return value ? new Date(value).getTime() : null;
}

function toIsoDate(value: number | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}

export function ApplicationTracker({ analysis }: ApplicationTrackerProps) {
  const t = useTranslations("jobs");

  const [appliedAt, setAppliedAt] = useState(toTimestamp(analysis.applied_at));
  const [interviewAt, setInterviewAt] = useState(
    toTimestamp(analysis.interview_at),
  );
  const [notes, setNotes] = useState(analysis.notes ?? "");
  const [failed, setFailed] = useState(false);

  const save = async (
    patch: Parameters<typeof updateAnalysisTrackingRequest>[1],
  ) => {
    const ok = await updateAnalysisTrackingRequest(analysis.id, patch);
    setFailed(!ok);
    return ok;
  };

  const savedNotesRef = useRef(analysis.notes ?? "");
  useEffect(() => {
    if (notes === savedNotesRef.current) return;
    const timer = setTimeout(async () => {
      savedNotesRef.current = notes;
      const ok = await updateAnalysisTrackingRequest(analysis.id, {
        notes: notes || null,
      });
      setFailed(!ok);
    }, ANALYSIS_NOTES_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [notes, analysis.id]);

  return (
    <Section title={t("detail.tracking.title")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <div className="flex flex-col gap-1">
          <Text tone="muted" size="sm">
            {t("detail.tracking.appliedAt")}
          </Text>
          <DateInput
            value={appliedAt}
            onChange={(value) => {
              setAppliedAt(value);
              save({ applied_at: toIsoDate(value) });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Text tone="muted" size="sm">
            {t("detail.tracking.interviewAt")}
          </Text>
          <DateInput
            value={interviewAt}
            onChange={(value) => {
              setInterviewAt(value);
              save({ interview_at: toIsoDate(value) });
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Text tone="muted" size="sm">
          {t("detail.tracking.notes")}
        </Text>
        <TextArea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t("detail.tracking.notesPlaceholder")}
        />
      </div>

      <InfoMessage message={failed ? t("detail.tracking.saveError") : null} />
    </Section>
  );
}
