"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";
import { SearchLayout } from "@/components/layout";
import { SearchInput } from "@/components/ui";

interface SearchUser {
  pseudo: string;
  first_name: string;
  last_name: string;
  location?: string | null;
}

interface SearchOverlayProps {
  onClose: () => void;
  onSelect?: (pseudo: string) => void;
}

export function SearchOverlay({ onClose, onSelect }: SearchOverlayProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50"
    >
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
            {(isLoading || results.length > 0) && (
              <>
                {isLoading && results.length === 0 ? (
                  <p className="text-sm">{t("searching")}</p>
                ) : (
                  <ul>
                    {results.map((user, idx) => (
                      <li key={user.pseudo}>
                        <button
                          key={idx}
                          className="text-txt hover:text-primary flex w-full cursor-pointer gap-2 rounded-sm py-3"
                          onClick={() => handleSelect(user.pseudo)}
                        >
                          <div className="min-w-0 text-left">
                            <p className="truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-txt-muted truncate text-xs">
                              {user.pseudo}
                              {user.location ? ` • ${user.location}` : ""}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {showNoResults && (
              <p className="text-error text-sm">{t("noResults")}</p>
            )}
          </AnimatePresence>
        </SearchLayout>
      </div>
    </motion.div>
  );
}
