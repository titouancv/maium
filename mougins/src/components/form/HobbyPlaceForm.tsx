"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchInput } from "@/components/ui/SearchInput";
import { EXTERNAL_API } from "@/constants";
import { flagUrl } from "@/lib/utils";

interface HobbyPlaceValue {
  countryName: string;
  countryCode: string;
}

interface PhotonProperties {
  country?: string;
  countrycode?: string;
}
interface PhotonResponse {
  features: { properties: PhotonProperties }[];
}

interface HobbyPlaceFormProps {
  defaultValue?: HobbyPlaceValue;
  onChange: (value: HobbyPlaceValue) => void;
}

export const HobbyPlaceForm = ({
  defaultValue,
  onChange,
}: HobbyPlaceFormProps) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [query, setQuery] = useState(defaultValue?.countryName ?? "");
  const [selected, setSelected] = useState<HobbyPlaceValue | undefined>(
    defaultValue?.countryCode ? defaultValue : undefined,
  );
  const [suggestions, setSuggestions] = useState<HobbyPlaceValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = query.length < 2 ? 0 : 300;
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        setIsEmpty(false);
        return;
      }
      setIsLoading(true);
      setIsEmpty(false);
      try {
        const res = await fetch(
          `${EXTERNAL_API.PHOTON_GEOCODE}?q=${encodeURIComponent(query)}&limit=6&lang=en&osm_tag=place:country`,
        );
        const data: PhotonResponse = await res.json();
        const results = data.features
          .map((f) => ({
            countryName: f.properties.country ?? "",
            countryCode: f.properties.countrycode ?? "",
          }))
          .filter((r) => r.countryName && r.countryCode)
          .filter(
            (r, i, a) =>
              a.findIndex((o) => o.countryCode === r.countryCode) === i,
          );
        setSuggestions(results);
        setIsEmpty(results.length === 0);
      } catch {
        setSuggestions([]);
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const infoLabel = isLoading
    ? tCommon("locationSearching")
    : isEmpty
      ? tCommon("locationNoResults")
      : undefined;

  return (
    <div className="flex flex-col gap-6 md:flex-1 md:justify-center">
      <SearchInput
        placeholder={t("hobbyPlacePlaceholder")}
        value={query}
        autoFocus
        infoLabel={infoLabel}
        infoType="info"
        suggestions={suggestions.map((s) => s.countryName)}
        onSelect={(name) => {
          const match = suggestions.find((s) => s.countryName === name);
          if (!match) return;
          setQuery(name);
          setSelected(match);
          setSuggestions([]);
          setIsEmpty(false);
          onChange(match);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (selected && e.target.value !== selected.countryName) {
            setSelected(undefined);
          }
        }}
      />
      {selected && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(selected.countryCode)}
            alt=""
            className="h-8 w-auto rounded-sm"
          />
        </div>
      )}
    </div>
  );
};
