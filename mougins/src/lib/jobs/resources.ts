import { EXTERNAL_API } from "@/constants";
import type { PrepPoint } from "@/types/job";

const SEARCH_PARAM_BY_RESOURCE_KIND = {
  video: "search_query",
  article: "q",
} as const;

const BASE_URL_BY_RESOURCE_KIND = {
  video: EXTERNAL_API.YOUTUBE_SEARCH,
  article: EXTERNAL_API.GOOGLE_SEARCH,
} as const;

export function prepResourceUrl(point: PrepPoint): string | null {
  const query = point.resource_query.trim();
  if (!query) return null;

  const url = new URL(BASE_URL_BY_RESOURCE_KIND[point.resource_kind]);
  url.searchParams.set(SEARCH_PARAM_BY_RESOURCE_KIND[point.resource_kind], query);
  return url.toString();
}
