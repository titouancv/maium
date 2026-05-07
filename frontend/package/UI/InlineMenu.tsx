"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface Tab {
  name: string;
  href: string;
}

interface InlineMenuProps {
  tabs: Tab[];
  layoutId: string;
}

export function InlineMenu({ tabs, layoutId }: InlineMenuProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="scrollbar-hide flex gap-4 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          className="relative px-4 py-1 font-bold whitespace-nowrap"
        >
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 ${
              isActive(tab.href)
                ? "text-on-primary"
                : "text-txt hover:text-primary"
            }`}
          >
            {tab.name}
          </motion.span>
          {isActive(tab.href) && (
            <motion.div
              layoutId={layoutId}
              className="from-secondary-400 to-primary inset-shadow-light-100/60 absolute inset-0 rounded-full bg-radial from-10% to-90% shadow-md inset-shadow-sm"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
