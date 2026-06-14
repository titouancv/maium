"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { ROUTES } from "@/constants";
import { usePathname } from "@/i18n/navigation";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { SearchOverlay } from "./SearchOverlay";
import { Tabs } from "./Tabs";
import { SearchButton } from "./SearchButton";

export function NavigationBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const pseudo = useCurrentUserStore((s) => s.user?.pseudo);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const tabs = [
    { name: t("home"), href: ROUTES.HOME },
    pseudo ? { name: t("messages"), href: ROUTES.MESSAGES } : undefined,
    pseudo ? { name: t("profile"), href: ROUTES.PROFILE(pseudo) } : undefined,
  ]
    .filter((tab) => tab !== undefined)
    .map((tab) => ({ name: tab.name.toLowerCase(), href: tab.href }));

  const isOnTabRoute = tabs.some(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
  );

  if (!isOnTabRoute) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Tabs tabs={tabs} />
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
