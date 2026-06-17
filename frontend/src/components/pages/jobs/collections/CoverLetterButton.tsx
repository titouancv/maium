"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
// Import UI primitives from their files, not the `@/components/ui` barrel:
// pulling this client tree through the barrel trips a Turbopack
// `export *` namespace-seal bug at build time (see AnalyzeJob).
import { Button } from "@/components/ui/Button";
import { Form } from "@/components/form";
import { useNotificationStore } from "@/stores/useNotificationStore";

interface Props {
  coverLetter: string;
}

/**
 * Opens a form overlay showing the AI-generated cover letter in an editable
 * textarea, with a primary action that copies the current text to the
 * clipboard. Edits stay local — they are never persisted.
 */
export function CoverLetterButton({ coverLetter }: Props) {
  const t = useTranslations("jobs");
  const notify = useNotificationStore((s) => s.notify);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(coverLetter);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      notify(t("detail.coverLetterCopied"));
    } catch {
      // Clipboard can be unavailable (insecure context / denied permission);
      // nothing actionable to do beyond leaving the text on screen to copy.
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        {t("detail.coverLetter")}
      </Button>
      {open && (
        <div className="bg-surface-50 fixed inset-0 z-50">
          <Form
            type="longText"
            title={t("detail.coverLetter")}
            step={1}
            totalSteps={1}
            isCancelable
            onCancel={() => setOpen(false)}
            cancelLabel={t("detail.close")}
            placeholder={t("detail.coverLetterPlaceholder")}
            rows={18}
            defaultValue={coverLetter}
            onChange={(v) => setText(v ?? "")}
            primaryLabel={t("detail.copyCoverLetter")}
            onPrimary={copy}
          />
        </div>
      )}
    </>
  );
}
