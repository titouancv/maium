"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { ROUTES } from "@/constants";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { SearchOverlay } from "@/components/overlay/SearchOverlay";
import { Tabs } from "./Tabs";
import { SearchButton } from "./SearchButton";

export function NavigationBar() {
  const t = useTranslations("nav");
  const pseudo = useCurrentUserStore((s) => s.user?.pseudo);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const tabs = [
    { name: t("home"), href: ROUTES.HOME },
    pseudo ? { name: `@${pseudo}`, href: ROUTES.PROFILE(pseudo) } : undefined,
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        <Tabs tabs={tabs.filter((t) => t !== undefined)} />
        <SearchButton onClick={() => setIsSearchOpen(true)} />
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isSearchOpen && (
              <SearchOverlay onClose={() => setIsSearchOpen(false)} />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
