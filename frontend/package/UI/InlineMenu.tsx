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
}

export function InlineMenu({ tabs }: InlineMenuProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex overflow-x-auto pb-1 scrollbar-hide gap-4">
      {tabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.href}
          className="relative py-1 px-4 font-bold whitespace-nowrap"
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
              layoutId="activeTab"
              className="absolute inset-0 bg-primary rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
