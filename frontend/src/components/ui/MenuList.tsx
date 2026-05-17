"use client";

import { Link } from "@/i18n/navigation";

interface MenuItem {
  label: string;
  href: string;
}

interface MenuListProps {
  items: MenuItem[];
}

export function MenuList({ items }: MenuListProps) {
  return (
    <ul className="w-full">
      {items.map(({ label, href }) => (
        <li key={href}>
          <Link
            href={href}
            className="text-txt hover:bg-surface-100 flex items-center justify-between rounded-sm px-2 py-4 transition-colors"
          >
            <span>{label}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-txt-muted"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}
