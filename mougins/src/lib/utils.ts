import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EXTERNAL_API } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ORDINAL_SUFFIX_EN: Record<Intl.LDMLPluralRule, string> = {
  zero: "th",
  one: "st",
  two: "nd",
  few: "rd",
  many: "th",
  other: "th",
};

export function formatOrdinal(n: number, locale: string): string {
  if (locale.startsWith("fr")) return n === 1 ? `${n}er` : `${n}e`;
  const rule = new Intl.PluralRules("en-US", { type: "ordinal" }).select(n);
  return `${n}${ORDINAL_SUFFIX_EN[rule]}`;
}

export function sanitizePseudo(value: string): string {
  return value.toLowerCase().replace(/[^a-z.]/g, "");
}

export function isValidUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function faviconUrl(domainOrUrl: string, size = 32): string {
  let domain = domainOrUrl;
  try {
    domain = new URL(domainOrUrl).hostname;
  } catch {}
  return `${EXTERNAL_API.FAVICON}?domain=${domain}&sz=${size}`;
}
