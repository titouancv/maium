"use client";

import { motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";
import type { TabItem } from "./Tabs";

export interface TabsVerticalProps {
  tabs: (string | TabItem)[];
  activeTab?: number;
  onChange?: (index: number) => void;
  layoutId?: string;
}

export function TabsVertical({
  tabs,
  activeTab,
  onChange,
  layoutId = "activeTabVertical",
}: TabsVerticalProps) {
  const pathname = usePathname();

  return (
    <div className="bg-inverse-50 text-txt-inverse flex flex-col gap-1 rounded-2xl px-1 py-1">
      {tabs.map((tab, idx) => {
        const isString = typeof tab === "string";
        const name = isString ? tab : tab.name;
        const href = isString ? undefined : tab.href;

        const isActive = href
          ? pathname === href || pathname.startsWith(href + "/")
          : activeTab === idx;

        const content = (
          <>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`relative z-10 ${
                isActive ? "text-on-primary" : "hover:text-primary"
              }`}
            >
              {name}
            </motion.span>
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="from-secondary-400 to-primary inset-shadow-light-100/60 absolute inset-0 rounded-xl bg-radial from-10% to-90% shadow-md inset-shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </>
        );

        if (href) {
          return (
            <Link
              key={name}
              href={href}
              className="relative px-4 py-2 whitespace-nowrap"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={idx}
            onClick={() => onChange?.(idx)}
            className="relative px-4 py-2 whitespace-nowrap text-left"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
