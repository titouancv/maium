"use client";

import { useTranslations } from "next-intl";
import { Button, TextInput, ChipList } from "@/components/ui";

interface Props {
  items: string[];
  draft: string;
  draftError: string | null;
  onDraftChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const SkillsField = ({
  items,
  draft,
  draftError,
  onDraftChange,
  onAdd,
  onRemove,
}: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <TextInput
          placeholder={t("skills")}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          infoLabel={draftError ?? ""}
          infoType={draftError ? "error" : "info"}
        />
        <Button
          variant="outline"
          type="button"
          className="mt-1 shrink-0"
          onClick={onAdd}
        >
          {tCommon("addButton")}
        </Button>
      </div>
      <ChipList items={items} onRemove={onRemove} />
    </div>
  );
};
