"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ANALYSIS_NOTES_CHAR_LIMIT } from "@/constants";
import {
  Button,
  ExpandableText,
  InfoMessage,
  Section,
  TextArea,
  Text,
} from "@/components/ui";
import { formatLongDate } from "@/lib/date";
import { updateAnalysisTrackingRequest } from "@/lib/jobs/updateTracking";
import { type AnalysisListItem } from "@/types/job";

interface ApplicationTrackerProps {
  analysis: AnalysisListItem;
}

export function ApplicationTracker({ analysis }: ApplicationTrackerProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [notes, setNotes] = useState(analysis.notes ?? "");
  const [draft, setDraft] = useState(analysis.notes ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const trackedSince =
    analysis.status === "not_started" || !analysis.status_changed_at
      ? { label: t("detail.tracking.analysed"), date: analysis.created_at }
      : {
          label: t("detail.tracking.statusOn", {
            status: t(`status.${analysis.status}`),
          }),
          date: analysis.status_changed_at,
        };

  const startEditing = () => {
    setDraft(notes);
    setFailed(false);
    setIsEditing(true);
  };

  const saveNotes = async () => {
    const trimmed = draft.trim();
    setIsSaving(true);
    const ok = await updateAnalysisTrackingRequest(analysis.id, {
      notes: trimmed || null,
    });
    setIsSaving(false);
    setFailed(!ok);
    if (!ok) return;
    setNotes(trimmed);
    setIsEditing(false);
  };

  return (
    <Section title={t("detail.tracking.title")}>
      <div className="flex flex-col">
        <Text className="font-extrabold" size="lg">
          {trackedSince.label}
        </Text>
        <Text tone="primary">{formatLongDate(trackedSince.date, locale)}</Text>
      </div>

      <div className="flex max-w-3xl flex-col gap-1">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 pb-2">
          <Text className="font-extrabold" size="lg">
            {t("detail.tracking.notes")}
          </Text>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={startEditing}
            >
              {notes ? tCommon("editButton") : tCommon("addButton")}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-1">
            <TextArea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("detail.tracking.notesPlaceholder")}
              maxLength={ANALYSIS_NOTES_CHAR_LIMIT}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                isLoading={isSaving}
                onClick={saveNotes}
              >
                {t("detail.tracking.notesSave")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                {tCommon("cancelButton")}
              </Button>
            </div>
          </div>
        ) : notes ? (
          <ExpandableText>{notes}</ExpandableText>
        ) : (
          <Text tone="muted" size="sm">
            {t("detail.tracking.notesPlaceholder")}
          </Text>
        )}
      </div>

      <InfoMessage message={failed ? t("detail.tracking.saveError") : null} />
    </Section>
  );
}
