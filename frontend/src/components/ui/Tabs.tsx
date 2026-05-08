"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TabItem {
  name: string;
  href?: string;
}

export interface TabsProps {
  tabs: (string | TabItem)[];
  activeTab?: number;
  onChange?: (index: number) => void;
  layoutId?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  layoutId = "activeTab",
}: TabsProps) {
  const pathname = usePathname();

  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto px-1">
      {tabs.map((tab, idx) => {
        const isString = typeof tab === "string";
        const name = isString ? tab : tab.name;
        const href = isString ? undefined : tab.href;

        const isActive = href ? pathname === href : activeTab === idx;

        const content = (
          <>
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`relative z-10 ${
                isActive ? "text-on-primary" : "text-txt hover:text-primary"
              }`}
            >
              {name}
            </motion.span>
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="from-secondary-400 to-primary inset-shadow-light-100/60 absolute inset-0 rounded-full bg-radial from-10% to-90% shadow-md inset-shadow-sm"
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
              className="relative px-4 py-1 whitespace-nowrap"
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={idx}
            onClick={() => onChange?.(idx)}
            className="relative px-4 py-1 whitespace-nowrap"
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
