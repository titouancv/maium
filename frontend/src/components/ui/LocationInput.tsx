"use client";

import { useState, useEffect, useRef } from "react";
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
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = query.length < 2 ? 0 : 300;
    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `${EXTERNAL_API.PHOTON_GEOCODE}?q=${encodeURIComponent(query)}&limit=6&lang=en`,
        );
        const data: PhotonResponse = await res.json();
        setSuggestions(
          data.features
            .map((f) => formatSuggestion(f.properties, format))
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i),
        );
      } catch {
        setSuggestions([]);
      }
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, format]);

  return (
    <SearchInput
      placeholder={placeholder}
      value={query}
      name={name}
      autoFocus={autoFocus}
      infoLabel={error}
      infoType={error ? "error" : "info"}
      suggestions={suggestions}
      onSelect={(s) => {
        setQuery(s);
        onChange(s);
        setSuggestions([]);
      }}
      onChange={(e) => {
        setQuery(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={onBlur}
    />
  );
}
