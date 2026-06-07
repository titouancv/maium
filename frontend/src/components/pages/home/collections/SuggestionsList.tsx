"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Title } from "@/components/ui";
import type { SuggestedUser } from "@/types";
import { SuggestionCard } from "../items";

interface SuggestionsListProps {
  suggestionsPromise: Promise<SuggestedUser[]>;
}

export const SuggestionsList = ({
  suggestionsPromise,
}: SuggestionsListProps) => {
  const t = useTranslations("home");
  const suggestions = use(suggestionsPromise);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <Title label={t("suggestions.title")} size="h3" />
      {suggestions.length === 0 ? (
        <p className="text-txt-muted text-sm">{t("suggestions.empty")}</p>
      ) : (
        <div className="-mx-1 flex min-h-0 flex-1 gap-4 overflow-x-auto px-1 pb-2">
          {suggestions.map((user) => (
            <SuggestionCard key={user.pseudo} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};
