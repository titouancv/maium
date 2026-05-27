"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ROUTES, API } from "@/constants";

interface SearchUser {
  pseudo: string;
  first_name: string;
  last_name: string;
  location?: string | null;
}

export function NewConversationButton() {
  const t = useTranslations("messaging");
  const tSearch = useTranslations("search");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API.USERS_SEARCH}?q=${encodeURIComponent(q)}`);
      const { users } = await res.json();
      setResults(users ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (pseudo: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch(API.MESSAGES_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPseudo: pseudo }),
      });

      if (res.ok) {
        const { conversationId } = await res.json();
        setOpen(false);
        setQuery("");
        setResults([]);
        router.push(ROUTES.CONVERSATION(conversationId));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-txt-muted hover:text-txt flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
        aria-label={t("newConversation")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="bg-surface-50 relative z-10 w-full max-w-md rounded-t-3xl p-6 shadow-xl sm:rounded-3xl">
            <h2 className="text-txt mb-4 text-base">{t("newConversation")}</h2>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={tSearch("placeholder")}
              className="text-txt placeholder:text-txt-muted bg-surface-100 focus:bg-surface-200 w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
            <div className="mt-2 flex flex-col gap-1">
              {loading && (
                <p className="text-txt-muted px-1 py-2 text-xs">
                  {tSearch("searching")}
                </p>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="text-txt-muted px-1 py-2 text-xs">
                  {tSearch("noResults")}
                </p>
              )}
              {results.map((u) => (
                <button
                  key={u.pseudo}
                  onClick={() => handleSelect(u.pseudo)}
                  disabled={creating}
                  className="text-txt hover:bg-surface-100 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors disabled:opacity-50"
                >
                  <div className="bg-surface-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs">
                    {u.first_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-txt-muted text-xs">@{u.pseudo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
