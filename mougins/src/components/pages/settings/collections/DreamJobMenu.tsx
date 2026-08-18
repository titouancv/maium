"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MenuList } from "@/components/ui";
import { DreamJobEditOverlay, type DreamJobField } from "./DreamJobEditOverlay";
import type { UserData } from "@/types";

interface Props {
  user: UserData;
}

export const DreamJobMenu = ({ user }: Props) => {
  const tDreamJob = useTranslations("dreamJob");
  const tCompanyType = useTranslations("dreamCompanyType");
  const tWorkMode = useTranslations("dreamWorkMode");
  const router = useRouter();
  const [editingField, setEditingField] = useState<DreamJobField | null>(null);

  const handleSaved = () => router.refresh();

  return (
    <>
      <MenuList
        items={[
          {
            label: tDreamJob("companyTypesLabel"),
            value: user.dream_company_types?.length
              ? user.dream_company_types
                  .map((type) => tCompanyType(type))
                  .join(", ")
              : undefined,
            onClick: () => setEditingField("companyTypes"),
          },
          {
            label: tDreamJob("workModeLabel"),
            value: user.dream_work_mode
              ? tWorkMode(user.dream_work_mode)
              : undefined,
            onClick: () => setEditingField("workMode"),
          },
          {
            label: tDreamJob("locationLabel"),
            value: user.dream_location ?? undefined,
            onClick: () => setEditingField("location"),
          },
          {
            label: tDreamJob("salaryLabel"),
            value: user.dream_salary ? String(user.dream_salary) : undefined,
            onClick: () => setEditingField("salary"),
          },
          {
            label: tDreamJob("industriesLabel"),
            value: user.dream_industries?.length
              ? String(user.dream_industries.length)
              : undefined,
            onClick: () => setEditingField("industries"),
          },
          {
            label: tDreamJob("companyValuesLabel"),
            value: user.dream_company_values ?? undefined,
            onClick: () => setEditingField("companyValues"),
          },
        ]}
      />

      {editingField && (
        <DreamJobEditOverlay
          field={editingField}
          user={user}
          onClose={() => setEditingField(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};
