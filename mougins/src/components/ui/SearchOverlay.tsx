"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { SearchLayout } from "@/components/layout";
import { InfoMessage } from "./InfoMessage";
import { Overlay } from "./Overlay";
import { SearchInput } from "./SearchInput";
import { UserCard } from "./UserCard";
import { Text } from "./Text";
import type { UserSummary } from "@/types";

interface SearchOverlayProps {
  onClose: () => void;
  onSelect?: (pseudo: string) => void;
}

export function SearchOverlay({ onClose, onSelect }: SearchOverlayProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API.USERS_SEARCH}?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.users ?? []);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (pseudo: string) => {
    if (onSelect) {
      onSelect(pseudo);
    } else {
      router.push(ROUTES.PROFILE(pseudo));
      onClose();
    }
  };

  const showNoResults =
    !isLoading && query.trim().length >= 2 && results.length === 0;

  return (
    <Overlay onClose={onClose}>
      <div className="relative z-10">
        <SearchLayout
          onCancel={onClose}
          cancelLabel={t("cancelButton")}
          searchInput={
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                if (!value.trim()) setResults([]);
              }}
              placeholder={t("placeholder")}
            />
          }
        >
          <AnimatePresence>
            {isLoading && results.length === 0 && (
              <Text key="searching" size="sm">
                {t("searching")}
              </Text>
            )}
            {results.length > 0 && (
              <ul key="results">
                {results.map((user) => (
                  <li key={user.pseudo}>
                    <UserCard
                      {...user}
                      profilePhoto={user.profile_photo}
                      onClick={() => handleSelect(user.pseudo)}
                      showFollow={!onSelect}
                      initialFollowing={user.is_following ?? false}
                    />
                  </li>
                ))}
              </ul>
            )}
            <InfoMessage
              key="no-results"
              message={showNoResults ? t("noResults") : null}
            />
          </AnimatePresence>
        </SearchLayout>
      </div>
    </Overlay>
  );
}
