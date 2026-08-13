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
import { Text } from "@/components/ui/Text";
import { InfoMessage } from "@/components/ui/InfoMessage";
import { FilePicker, type FilePickerHandle } from "@/components/ui/FilePicker";
import type { CvExtraction } from "@/lib/validators/cv";

interface CvImportFormProps {
  onChange: (extraction: CvExtraction) => void;
  isSubmitting?: boolean;
}

interface Summary {
  extraction: CvExtraction;
  counts: { key: string; count: number }[];
}

const isAcceptedType = (type: string) =>
  (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(type);

function summarize(extraction: CvExtraction): Summary["counts"] {
  return (
    [
      ["experiences", extraction.professionalExperiences?.length ?? 0],
      ["education", extraction.educationalExperiences?.length ?? 0],
      ["personal", extraction.personalExperiences?.length ?? 0],
      ["skills", extraction.skills?.length ?? 0],
      ["hobbies", extraction.hobbies?.length ?? 0],
      [
        "links",
        (extraction.socialNetworks?.length ?? 0) +
          (extraction.projects?.length ?? 0),
      ],
    ] as const
  )
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }));
}

export const CvImportForm = ({
  onChange,
  isSubmitting,
}: CvImportFormProps) => {
  const t = useTranslations("form.cvImport");
  const fileRef = useRef<FilePickerHandle>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

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
    setSummary(null);
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
      const counts = summarize(profile);
      if (counts.length === 0 && !profile.firstName && !profile.bio) {
        setError(t("errorEmpty"));
        return;
      }
      setSummary({ extraction: profile, counts });
    } catch {
      setError(t("errorParse"));
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <Text tone="muted" size="sm">
        {t("description")}
      </Text>

      {summary ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Text size="sm" className="font-extrabold">
              {t("foundTitle")}
            </Text>
            <ul className="flex flex-col gap-1">
              {summary.extraction.firstName && (
                <Text as="li" tone="muted" size="sm">
                  {t("foundName", {
                    name: [
                      summary.extraction.firstName,
                      summary.extraction.lastName,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  })}
                </Text>
              )}
              {summary.counts.map(({ key, count }) => (
                <Text as="li" tone="muted" size="sm" key={key}>
                  {t(`found.${key}`, { count })}
                </Text>
              ))}
            </ul>
          </div>

          <Button
            variant="outline"
            type="button"
            size="md"
            className="w-full"
            onClick={() => fileRef.current?.open()}
          >
            {t("chooseAnother")}
          </Button>

          <Button
            type="button"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            onClick={() => onChange(summary.extraction)}
          >
            {t("confirm")}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          type="button"
          size="lg"
          className="w-full"
          isLoading={isParsing}
          onClick={() => fileRef.current?.open()}
        >
          {isParsing ? t("parsing") : t("choose")}
        </Button>
      )}

      <InfoMessage message={error} />

      <FilePicker
        ref={fileRef}
        accept={CV_ACCEPT_ATTRIBUTE}
        onPick={handleFile}
      />
    </div>
  );
};
