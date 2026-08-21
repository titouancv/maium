"use client";

import { useEffect, useState } from "react";
import { API } from "@/constants";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { faviconUrl } from "@/lib/utils";

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const isGithubHost = (hostname: string) =>
  hostname === "github.com" || hostname.endsWith(".github.com");

interface Props {
  url: string;
}

export const UrlItem = ({ url }: Props) => {
  const hostname = getHostname(url);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API.URL_TITLE}?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.title) setTitle(data.title);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-txt hover:text-primary flex min-w-0 items-center gap-2 text-sm transition-colors"
    >
      {isGithubHost(hostname) ? (
        <Icon name="github" size={16} />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={faviconUrl(hostname)}
          alt=""
          width={16}
          height={16}
          className="shrink-0"
        />
      )}
      {loading ? (
        <Skeleton className="h-3.5 w-32" />
      ) : (
        <span className="truncate">{title ?? hostname}</span>
      )}
    </a>
  );
};
