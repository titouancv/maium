"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SearchInput } from "./SearchInput";
import { EXTERNAL_API } from "@/constants";

type LocationFormat = "country" | "city-country";

interface PhotonProperties {
  name?: string;
  country?: string;
}
interface PhotonResponse {
  features: { properties: PhotonProperties }[];
}

function formatSuggestion(props: PhotonProperties, format: LocationFormat): string {
  const country = props.country ?? "";
  if (format === "country") return country;
  const name = props.name ?? "";
  if (!name || name === country) return country;
  return country ? `${name}, ${country}` : name;
}

export interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder: string;
  error?: string;
  autoFocus?: boolean;
  format?: LocationFormat;
}

export function LocationInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  error,
  autoFocus,
  format = "city-country",
}: LocationInputProps) {
  const t = useTranslations("common");
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
          `${EXTERNAL_API.PHOTON_GEOCODE}?q=${encodeURIComponent(query)}&limit=6&lang=en`,
        );
        const data: PhotonResponse = await res.json();
        const results = data.features
          .map((f) => formatSuggestion(f.properties, format))
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);
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
  }, [query, format]);

  const infoLabel = error ?? (isLoading ? t("locationSearching") : isEmpty ? t("locationNoResults") : undefined);
  const infoType: "error" | "info" = error || isEmpty ? "error" : "info";

  return (
    <SearchInput
      placeholder={placeholder}
      value={query}
      name={name}
      autoFocus={autoFocus}
      infoLabel={infoLabel}
      infoType={infoType}
      suggestions={suggestions}
      onSelect={(s) => {
        setQuery(s);
        onChange(s);
        setSuggestions([]);
        setIsEmpty(false);
      }}
      onChange={(e) => {
        setQuery(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={onBlur}
    />
  );
}
