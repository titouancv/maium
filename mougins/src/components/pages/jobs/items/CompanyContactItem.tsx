"use client";

import { useTranslations } from "next-intl";
import { Button, UserCard } from "@/components/ui";
import { experiencePeriodYears } from "@/lib/date";
import { useStartConversation } from "@/hooks";
import type { CompanyContact } from "@/types/job";

interface CompanyContactItemProps {
  contact: CompanyContact;
}

export function CompanyContactItem({ contact }: CompanyContactItemProps) {
  const t = useTranslations("jobs");
  const { start, isStarting } = useStartConversation();

  const { startYear, endYear } = experiencePeriodYears(
    contact.start_period,
    contact.end_period ?? undefined,
  );
  const period = endYear
    ? t("detail.contacts.pastRole", { role: contact.role, startYear, endYear })
    : t("detail.contacts.currentRole", { role: contact.role, startYear });

  return (
    <li className="flex w-full items-center gap-2">
      <UserCard
        pseudo={contact.pseudo}
        first_name={contact.first_name}
        last_name={contact.last_name}
        profilePhoto={contact.profile_photo}
        subtitle={period}
      />
      <Button
        variant="outline"
        size="sm"
        type="button"
        className="shrink-0 self-center"
        isLoading={isStarting}
        onClick={() => start(contact.pseudo)}
      >
        {t("detail.contacts.contact")}
      </Button>
    </li>
  );
}
