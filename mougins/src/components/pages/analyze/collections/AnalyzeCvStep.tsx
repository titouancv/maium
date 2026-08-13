"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  API,
  CV_ACCEPT_ATTRIBUTE,
  CV_ACCEPTED_MIME_TYPES,
  CV_MAX_BYTES,
} from "@/constants";
import { Button } from "@/components/ui/Button";
import { Title } from "@/components/ui/Title";
import { Text } from "@/components/ui/Text";
import { InfoMessage } from "@/components/ui/InfoMessage";
import { FilePicker, type FilePickerHandle } from "@/components/ui/FilePicker";
import type { CvExtraction } from "@/lib/validators/cv";

interface AnalyzeCvStepProps {
  onParsed: (extraction: CvExtraction) => void;
}

const isAcceptedType = (type: string) =>
  (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(type);

export function AnalyzeCvStep({ onParsed }: AnalyzeCvStepProps) {
  const t = useTranslations("analyze.cv");
  const fileRef = useRef<FilePickerHandle>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
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
        <Text tone="muted" size="sm">
          {t("description")}
        </Text>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        isLoading={isParsing}
        onClick={() => fileRef.current?.open()}
      >
        {isParsing ? t("parsing") : t("choose")}
      </Button>

      <InfoMessage message={error} />

      <Text tone="muted" size="xs">
        {t("privacyNote")}
      </Text>

      <FilePicker
        ref={fileRef}
        accept={CV_ACCEPT_ATTRIBUTE}
        onPick={handleFile}
      />
    </div>
  );
}
