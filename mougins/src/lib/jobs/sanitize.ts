import { JOB_TEXT_CHAR_LIMIT } from "@/constants";

export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+(?:hidden|aria-hidden=["']true["']|display\s*:\s*none)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(text)
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, JOB_TEXT_CHAR_LIMIT);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  const TRACKING = /^(utm_|fbclid|gclid|mc_|ref$|source$)/i;
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING.test(key)) url.searchParams.delete(key);
  }
  let normalized = url.toString();
  if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
  return normalized;
}

export async function fetchJobText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "MaiumBot/1.0 (+https://maium.app)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch job posting (${res.status})`);
  }
  const html = await res.text();
  return htmlToPlainText(html);
}
