"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  API,
  CV_ACCEPT_ATTRIBUTE,
  CV_ACCEPTED_MIME_TYPES,
  CV_MAX_BYTES,
} from "@/constants";
// Import UI primitives from their files, not the `@/components/ui` barrel:
// pulling a new client tree through the barrel trips a Turbopack `export *`
// namespace-seal bug at build time (see also AnalyzeJob/JobsSkeleton).
import { Button } from "@/components/ui/Button";
import { Title } from "@/components/ui/Title";
import type { CvExtraction } from "@/lib/validators/cv";

interface AnalyzeCvStepProps {
  onParsed: (extraction: CvExtraction) => void;
}

const isAcceptedType = (type: string) =>
  (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(type);

/** First step of the public funnel: turn a CV into a profile to match against. */
export function AnalyzeCvStep({ onParsed }: AnalyzeCvStepProps) {
  const t = useTranslations("analyze.cv");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;

    if (!isAcceptedType(file.type)) {
      setError(t("errorType"));
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setError(t("errorSize"));
      return;
    }

    setError(null);
    setIsParsing(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(API.CV_PARSE, { method: "POST", body });
      if (!res.ok) {
        setError(res.status === 429 ? t("errorRateLimited") : t("errorParse"));
        return;
      }
      const { profile } = (await res.json()) as { profile: CvExtraction };
      onParsed(profile);
    } catch {
      setError(t("errorParse"));
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title label={t("title")} size="h2" />
        <p className="text-txt-muted text-sm">{t("description")}</p>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        isLoading={isParsing}
        onClick={() => inputRef.current?.click()}
      >
        {isParsing ? t("parsing") : t("choose")}
      </Button>

      {error && <p className="text-error text-sm">{error}</p>}

      <p className="text-txt-muted text-xs">{t("privacyNote")}</p>

      <input
        ref={inputRef}
        type="file"
        accept={CV_ACCEPT_ATTRIBUTE}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
