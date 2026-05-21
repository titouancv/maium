"use client";

import { useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { SocialNetworkItem } from "../custom";
import { Button, TextInput } from "../ui";

interface SocialNetworkFormProps {
  defaultValue?: string[];
  onChange: (socialNetworks: string[]) => void;
}

export const SocialNetworkForm = ({
  defaultValue,
  onChange,
}: SocialNetworkFormProps) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const [items, setItems] = useState<string[]>(defaultValue ?? []);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  const handleAdd = () => {
    const val = draft.trim();
    if (!val) return;
    if (!z.url().safeParse(val).success) {
      setDraftError(t("urlInvalid"));
      return;
    }
    const next = [...items, val];
    setItems(next);
    onChange(next);
    setDraft("");
    setDraftError(null);
  };

  const handleRemove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    onChange(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <div className="flex shrink-0 flex-col gap-1">
        <TextInput
          placeholder="https://www.instagram.com/..."
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          infoLabel={draftError ?? ""}
          infoType={draftError ? "error" : "info"}
        />
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleAdd}
        >
          {tCommon("addButton")}
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {items.map((url, i) => {
              return (
                <li
                  key={`${url}-${i}`}
                  className="flex items-center justify-between gap-3"
                >
                  <SocialNetworkItem url={url} />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleRemove(i)}
                  >
                    {t("deleteButton")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
