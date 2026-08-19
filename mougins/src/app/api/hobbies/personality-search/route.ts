import { NextRequest, NextResponse } from "next/server";

const WIKIPEDIA_LOCALES = new Set(["en", "fr"]);
const RESULT_LIMIT = 6;

interface WikipediaPage {
  index?: number;
  title: string;
  thumbnail?: { source: string };
  terms?: { description?: string[] };
}

interface WikipediaQueryResponse {
  query?: { pages?: Record<string, WikipediaPage> };
}

export interface PersonalitySearchResult {
  title: string;
  description: string | null;
  thumbnailUrl: string;
  pageUrl: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale = WIKIPEDIA_LOCALES.has(localeParam ?? "") ? localeParam! : "en";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(`https://${locale}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", q);
  url.searchParams.set("gsrlimit", String(RESULT_LIMIT));
  url.searchParams.set("prop", "pageimages|pageterms");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "160");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" },
    });
    const data: WikipediaQueryResponse = await response.json();
    const pages = Object.values(data.query?.pages ?? {});

    const results: PersonalitySearchResult[] = pages
      .filter((p) => p.thumbnail?.source)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((p) => ({
        title: p.title,
        description: p.terms?.description?.[0] ?? null,
        thumbnailUrl: p.thumbnail!.source,
        pageUrl: `https://${locale}.wikipedia.org/wiki/${encodeURIComponent(
          p.title.replace(/ /g, "_"),
        )}`,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
