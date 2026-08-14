"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { Section, Text } from "@/components/ui";
import type { AnalysisListItem } from "@/types/job";
import { AnonAccountCta } from "./AnonAccountCta";

interface AnonLockedContactsProps {
  analysis: AnalysisListItem;
}

interface ContactsCount {
  company: string | null;
  count: number;
}

export function AnonLockedContacts({ analysis }: AnonLockedContactsProps) {
  const t = useTranslations("jobs");
  const tAccount = useTranslations("analyze.account");
  const [preview, setPreview] = useState<ContactsCount | null>(null);

  useEffect(() => {
    let active = true;

    fetch(API.ANALYSIS_CONTACTS_COUNT(analysis.id))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ContactsCount | null) => {
        if (active && data) setPreview(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [analysis.id]);

  const peers =
    preview && preview.company && preview.count > 0
      ? { count: preview.count, company: preview.company }
      : null;

  return (
    <Section title={t("detail.contacts.title")}>
      <Text tone="muted" size="sm">
        {tAccount("lockedContacts.description")}
      </Text>

      {peers && (
        <Text tone="primary">{tAccount("lockedContacts.count", peers)}</Text>
      )}

      <AnonAccountCta
        label={tAccount("cta.contacts")}
        source="locked_contacts"
        analysisId={analysis.id}
      />
    </Section>
  );
}
