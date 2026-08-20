"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TextInput } from "@/components/ui/TextInput";
import { Text } from "@/components/ui/Text";
import { API, type InfoType } from "@/constants";
import { imageBackdropTheme, useImageTone } from "@/hooks";
import { cn } from "@/lib/utils";
import type { WikipediaSearchResult } from "@/app/api/hobbies/wikipedia-search/route";

interface HobbyWikipediaValue {
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
}

interface HobbyWikipediaFormProps {
  defaultValue?: HobbyWikipediaValue;
  onChange: (value: HobbyWikipediaValue) => void;
  infoLabel?: string;
  infoType?: InfoType;
}

/** Wikipedia results are often transparent logos: put them on a contrasting plate. */
const Thumbnail = ({ src, className }: { src: string; className: string }) => {
  const tone = useImageTone(src);

  return (
    <div
      data-theme={imageBackdropTheme(tone)}
      className={cn("bg-surface-100 overflow-hidden rounded-sm p-1", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain" />
    </div>
  );
};

export const HobbyWikipediaForm = ({
  defaultValue,
  onChange,
  infoLabel,
  infoType = "info",
}: HobbyWikipediaFormProps) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [query, setQuery] = useState(defaultValue?.title ?? "");
  const [selected, setSelected] = useState<HobbyWikipediaValue | undefined>(
    defaultValue?.imageUrl ? defaultValue : undefined,
  );
  const [results, setResults] = useState<WikipediaSearchResult[]>([]);
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
          `${API.HOBBIES_WIKIPEDIA_SEARCH}?q=${encodeURIComponent(query)}&locale=${locale}`,
        );
        const data: { results: WikipediaSearchResult[] } = await res.json();
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

  const type = (title: string) => {
    setQuery(title);
    setSelected(undefined);
    onChange({ title });
  };

  const select = (result: WikipediaSearchResult) => {
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

  return (
    <div className="flex flex-col gap-4 md:flex-1 md:justify-center">
      <TextInput
        placeholder={t("hobbyTitlePlaceholder")}
        value={query}
        autoFocus
        onChange={(e) => type(e.target.value)}
        infoLabel={infoLabel}
        infoType={infoType}
      />

      {selected?.imageUrl && (
        <div className="flex items-center gap-3">
          <Thumbnail src={selected.imageUrl} className="h-14 w-14 shrink-0" />
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
                <Thumbnail
                  src={result.thumbnailUrl}
                  className="h-10 w-10 shrink-0"
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
          {t("hobbyWikipediaNoResults")}
        </Text>
      )}
    </div>
  );
};
