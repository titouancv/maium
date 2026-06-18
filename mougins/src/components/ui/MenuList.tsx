"use client";

import { Link } from "@/i18n/navigation";

interface MenuItemBase {
  label: string;
  value?: string;
}

interface MenuItemLink extends MenuItemBase {
  href: string;
  onClick?: never;
}

interface MenuItemButton extends MenuItemBase {
  onClick: () => void;
  href?: never;
}

type MenuItem = MenuItemLink | MenuItemButton;

interface MenuListProps {
  items: MenuItem[];
}

export function MenuList({ items }: MenuListProps) {
  return (
    <ul className="w-full">
      {items.map(({ label, value, href, onClick }) => {
        const key = href ?? label;
        const inner = (
          <div className="flex w-full items-center justify-between gap-2">
            <span className="shrink-0">{label}</span>
            <span className="flex min-w-0 items-center gap-2">
              {value && (
                <span className="text-txt-muted group-hover:text-primary min-w-0 truncate transition-colors">
                  {value}
                </span>
              )}
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
                className="text-txt-muted group-hover:text-primary shrink-0 transition-colors"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </div>
        );
        const className =
          "group text-txt hover:text-primary hover:cursor-pointer flex items-center justify-between rounded-sm py-4 transition-colors w-full text-left";

        return (
          <li key={key}>
            {href ? (
              <Link href={href} className={className}>
                {inner}
              </Link>
            ) : (
              <button type="button" onClick={onClick} className={className}>
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
