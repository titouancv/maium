"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Overlay } from "@/components/ui/Overlay";
import { Form } from "@/components/form";
import { useNotificationStore } from "@/stores/useNotificationStore";

interface Props {
  coverLetter: string;
}

export function CoverLetterButton({ coverLetter }: Props) {
  const t = useTranslations("jobs");
  const notify = useNotificationStore((s) => s.notify);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(coverLetter);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      notify(t("detail.coverLetterCopied"), undefined, "surface");
    } catch {}
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
        <Overlay onClose={() => setOpen(false)}>
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
        </Overlay>
      )}
    </>
  );
}
