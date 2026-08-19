"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { API } from "@/constants";
import type { PersonalitySearchResult } from "@/app/api/hobbies/personality-search/route";

interface HobbyPersonalityValue {
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
}

interface HobbyPersonalityFormProps {
  defaultValue?: HobbyPersonalityValue;
  onChange: (value: HobbyPersonalityValue) => void;
}

export const HobbyPersonalityForm = ({
  defaultValue,
  onChange,
}: HobbyPersonalityFormProps) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [query, setQuery] = useState(defaultValue?.title ?? "");
  const [selected, setSelected] = useState<HobbyPersonalityValue | undefined>(
    defaultValue,
  );
  const [results, setResults] = useState<PersonalitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = query.length < 2 ? 0 : 300;
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API.HOBBIES_PERSONALITY_SEARCH}?q=${encodeURIComponent(query)}&locale=${locale}`,
        );
        const data: { results: PersonalitySearchResult[] } = await res.json();
        setResults(data.results);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locale]);

  const select = (result: PersonalitySearchResult) => {
    const value = {
      title: result.title,
      imageUrl: result.thumbnailUrl,
      sourceUrl: result.pageUrl,
    };
    setSelected(value);
    setQuery(result.title);
    setResults([]);
    onChange(value);
  };

  const skip = () => {
    const value = { title: query.trim() };
    setSelected(value);
    setResults([]);
    onChange(value);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-1 md:justify-center">
      <TextInput
        placeholder={t("hobbyPersonalityPlaceholder")}
        value={query}
        autoFocus
        onChange={(e) => {
          setQuery(e.target.value);
          if (selected) setSelected(undefined);
        }}
      />

      {selected?.imageUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.imageUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover"
          />
          <Text tone="muted" size="sm">
            {selected.title}
          </Text>
        </div>
      )}

      {!selected && isLoading && (
        <Text tone="muted" size="sm">
          {tCommon("loading")}
        </Text>
      )}

      {!selected && !isLoading && results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((result) => (
            <li key={result.pageUrl}>
              <button
                type="button"
                onClick={() => select(result)}
                className="hover:bg-surface-100 flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.thumbnailUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <div className="flex min-w-0 flex-col">
                  <Text truncate>{result.title}</Text>
                  {result.description && (
                    <Text tone="muted" size="sm" truncate>
                      {result.description}
                    </Text>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selected && !isLoading && query.length >= 2 && results.length === 0 && (
        <Text tone="muted" size="sm">
          {t("hobbyPersonalityNoResults")}
        </Text>
      )}

      {!selected && query.trim().length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={skip}
        >
          {t("hobbyPersonalitySkip")}
        </Button>
      )}
    </div>
  );
};
