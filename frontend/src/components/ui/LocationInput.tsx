"use client";

import { useState, useEffect, useRef } from "react";
import { SearchInput } from "./SearchInput";
import { EXTERNAL_API } from "@/constants";

interface PhotonProperties {
  name?: string;
  country?: string;
  city?: string;
}

interface PhotonResponse {
  features: { properties: PhotonProperties }[];
}

function formatSuggestion(props: PhotonProperties): string {
  const name = props.name ?? "";
  const country = props.country ?? "";
  if (!name) return country;
  if (name === country) return country;
  if (country) return `${name}, ${country}`;
  return name;
}

export interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder: string;
  error?: string;
  autoFocus?: boolean;
}

export function LocationInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  error,
  autoFocus,
}: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = query.length >= 2 && suggestions.length > 0;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Use 0ms delay when clearing so it's not synchronous, but still instant
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
        const results = data.features
          .map((f) => formatSuggestion(f.properties))
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    onChange(suggestion);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchInput
        placeholder={placeholder}
        value={query}
        name={name}
        autoFocus={autoFocus}
        infoLabel={error}
        infoType={error ? "error" : "info"}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={onBlur}
      />
      {isOpen && (
        <ul className="bg-surface-50 border-brd-200 absolute z-50 mt-1 w-full overflow-hidden rounded-xl border shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s}
              className="text-txt hover:bg-surface-100 cursor-pointer px-4 py-3 text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
