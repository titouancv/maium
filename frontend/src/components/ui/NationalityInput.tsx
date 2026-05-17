"use client";

import { useState, useEffect, useRef } from "react";
import { SearchInput } from "./SearchInput";
import { EXTERNAL_API } from "@/constants";

interface CountryName {
  common: string;
}

interface CountryResult {
  name: CountryName;
}

export interface NationalityInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder: string;
  error?: string;
  autoFocus?: boolean;
}

export function NationalityInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  error,
  autoFocus,
}: NationalityInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = query.length >= 2 && suggestions.length > 0;

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
          `${EXTERNAL_API.RESTCOUNTRIES}/name/${encodeURIComponent(query)}?fields=name`,
        );
        if (!res.ok) { setSuggestions([]); return; }
        const data: CountryResult[] = await res.json();
        const results = data
          .map((c) => c.name.common)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 6);
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
        autoComplete="off"
        infoLabel={error}
        infoType={error ? "error" : "info"}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={onBlur}
      />
      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-sm backdrop-blur-sm">
          {suggestions.map((s) => (
            <li
              key={s}
              className="text-txt hover:bg-surface-100 cursor-pointer rounded-sm px-4 py-3 text-sm"
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
