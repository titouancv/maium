"use client";

import { useTranslations } from "next-intl";
import { EmptyState, Section, Text } from "@/components/ui";
import type { CompanyContact } from "@/types/job";
import { CompanyContactItem } from "../items/CompanyContactItem";

interface CompanyContactListProps {
  contacts: CompanyContact[];
  company: string;
}

export function CompanyContactList({
  contacts,
  company,
}: CompanyContactListProps) {
  const t = useTranslations("jobs");

  return (
    <Section title={t("detail.contacts.title")}>
      <Text tone="muted" size="sm">
        {t("detail.contacts.subtitle", { company })}
      </Text>
      {contacts.length === 0 ? (
        <EmptyState label={t("detail.contacts.empty", { company })} />
      ) : (
        <ul className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {contacts.map((contact) => (
            <CompanyContactItem key={contact.pseudo} contact={contact} />
          ))}
        </ul>
      )}
    </Section>
  );
}
