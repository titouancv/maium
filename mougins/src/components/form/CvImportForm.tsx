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
import type { CvExtraction } from "@/lib/validators/cv";

interface CvImportFormProps {
  /** Fired with the extracted draft once the user confirms the summary. */
  onChange: (extraction: CvExtraction) => void;
  /** True while the parent persists the confirmed draft — blocks a second confirm. */
  isSubmitting?: boolean;
}

/** What the extraction yielded, for the confirmation screen. */
interface Summary {
  extraction: CvExtraction;
  counts: { key: string; count: number }[];
}

const isAcceptedType = (type: string) =>
  (CV_ACCEPTED_MIME_TYPES as readonly string[]).includes(type);

/**
 * Every collection the extraction can carry, so the confirmation screen shows
 * exactly what the PATCH will write — a field missing here would be persisted
 * without ever being shown, which defeats the point of the screen.
 */
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

/**
 * Signup step that imports a CV: pick a PDF/image, OCR it through
 * `POST /api/cv/parse`, then show what was found before anything is written.
 *
 * The confirmation screen is not decoration. `PATCH /api/users/me` replaces
 * each collection wholesale, and the extraction comes from a language model —
 * the user must see what is about to land on their profile and be able to back
 * out. Choosing another file re-runs the import; the wizard's "skip" leaves the
 * profile untouched.
 */
export const CvImportForm = ({
  onChange,
  isSubmitting,
}: CvImportFormProps) => {
  const t = useTranslations("form.cvImport");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

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
      // Nothing usable came back: say so rather than showing an empty summary
      // and letting the user "confirm" a no-op.
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
      <p className="text-txt-muted text-sm">{t("description")}</p>

      {summary ? (
        <div className="flex flex-col gap-6">
          <div className="border-brd-200 flex flex-col gap-3 rounded-sm border p-4">
            <p className="text-sm font-extrabold">{t("foundTitle")}</p>
            <ul className="flex flex-col gap-1">
              {summary.extraction.firstName && (
                <li className="text-txt-muted text-sm">
                  {t("foundName", {
                    name: [
                      summary.extraction.firstName,
                      summary.extraction.lastName,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  })}
                </li>
              )}
              {summary.counts.map(({ key, count }) => (
                <li key={key} className="text-txt-muted text-sm">
                  {t(`found.${key}`, { count })}
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="outline"
            type="button"
            size="md"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            {t("chooseAnother")}
          </Button>

          {/* `isLoading` swaps the button for static text, so a second click
              can't advance the wizard twice and skip the next step. */}
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
          onClick={() => inputRef.current?.click()}
        >
          {isParsing ? t("parsing") : t("choose")}
        </Button>
      )}

      {error && <p className="text-error text-sm">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={CV_ACCEPT_ATTRIBUTE}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
};
