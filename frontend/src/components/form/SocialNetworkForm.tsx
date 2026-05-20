"use client";

import { useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { UrlListField } from "../custom";

interface SocialNetworkFormProps {
  defaultValue?: string[];
  onChange: (socialNetworks: string[]) => void;
}

export const SocialNetworkForm = ({
  defaultValue,
  onChange,
}: SocialNetworkFormProps) => {
  const t = useTranslations("settings");

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
    <UrlListField
      items={items}
      draft={draft}
      draftError={draftError}
      onDraftChange={(val) => {
        setDraft(val);
        setDraftError(null);
      }}
      onAdd={handleAdd}
      onRemove={handleRemove}
      isSocialNetwork
    />
  );
};
