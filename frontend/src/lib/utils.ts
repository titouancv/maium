import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { EXTERNAL_API } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function faviconUrl(domainOrUrl: string, size = 32): string {
  let domain = domainOrUrl;
  try {
    domain = new URL(domainOrUrl).hostname;
  } catch {
    // already a bare domain
  }
  return `${EXTERNAL_API.FAVICON}?domain=${domain}&sz=${size}`;
}
