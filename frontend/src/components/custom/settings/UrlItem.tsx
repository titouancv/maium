"use client";

import { useEffect, useState } from "react";
import { API } from "@/constants";
import { Skeleton } from "@/components/ui/Skeleton";

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

interface Props {
  url: string;
}

export const UrlItem = ({ url }: Props) => {
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${getHostname(url)}&sz=32`}
        alt=""
        width={16}
        height={16}
        className="shrink-0"
      />
      {loading ? (
        <Skeleton className="h-3.5 w-32" />
      ) : (
        <span className="truncate">{title ?? getHostname(url)}</span>
      )}
    </a>
  );
};
