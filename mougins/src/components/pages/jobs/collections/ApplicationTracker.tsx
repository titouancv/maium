"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ANALYSIS_NOTES_CHAR_LIMIT, ANALYSIS_SNOOZE_DAYS } from "@/constants";
import {
  Button,
  ExpandableText,
  InfoMessage,
  Section,
  Selector,
  TextArea,
  Text,
} from "@/components/ui";
import { addDays, formatLongDate, isPast } from "@/lib/date";
import { updateAnalysisTrackingRequest } from "@/lib/jobs/updateTracking";
import {
  SETTLED_APPLICATION_STATUSES,
  type AnalysisListItem,
  type SnoozeDelay,
} from "@/types/job";

interface ApplicationTrackerProps {
  analysis: AnalysisListItem;
}

const SNOOZE_OPTIONS = [null, ...ANALYSIS_SNOOZE_DAYS] as const;

function toSnoozeDelay(days: number | null): SnoozeDelay | null {
  return ANALYSIS_SNOOZE_DAYS.find((option) => option === days) ?? null;
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
  const [snoozeDays, setSnoozeDays] = useState(
    toSnoozeDelay(analysis.snooze_days),
  );

  const isSettled = SETTLED_APPLICATION_STATUSES.some(
    (status) => status === analysis.status,
  );

  const trackedSince =
    analysis.status === "not_started" || !analysis.status_changed_at
      ? { label: t("detail.tracking.analysed"), date: analysis.created_at }
      : {
          label: t("detail.tracking.statusOn", {
            status: t(`status.${analysis.status}`),
          }),
          date: analysis.status_changed_at,
        };

  const snoozeDate =
    snoozeDays === null ? null : addDays(trackedSince.date, snoozeDays);
  const isSnoozeOverdue = snoozeDate !== null && isPast(snoozeDate);

  const changeSnooze = async (index: number) => {
    const next = SNOOZE_OPTIONS[index];
    const previous = snoozeDays;
    setSnoozeDays(next);
    setFailed(false);
    const ok = await updateAnalysisTrackingRequest(analysis.id, {
      snooze_days: next,
    });
    if (ok) return;
    setSnoozeDays(previous);
    setFailed(true);
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

      <div className="flex max-w-3xl flex-col gap-2">
        <Text className="font-extrabold" size="lg">
          {t("detail.tracking.snooze")}
        </Text>
        {isSettled ? (
          <Text tone="muted" size="sm">
            {t("detail.tracking.snoozeSettled")}
          </Text>
        ) : (
          <>
            <Selector
              values={SNOOZE_OPTIONS.map((days) =>
                days === null
                  ? t("detail.tracking.snoozeOff")
                  : t("detail.tracking.snoozeDays", { days }),
              )}
              activeIndex={SNOOZE_OPTIONS.indexOf(snoozeDays)}
              onChange={changeSnooze}
            />
            <Text tone="muted" size="sm">
              {snoozeDate === null
                ? t("detail.tracking.snoozeOffHint")
                : isSnoozeOverdue
                  ? t("detail.tracking.snoozeOverdueHint")
                  : t("detail.tracking.snoozeHint", {
                      date: formatLongDate(snoozeDate, locale),
                    })}
            </Text>
          </>
        )}
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
