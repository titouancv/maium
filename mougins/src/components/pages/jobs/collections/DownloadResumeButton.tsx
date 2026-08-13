"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ResumeEditorOverlay } from "./ResumeEditorOverlay";

interface Props {
  resumeId: string;
}

export function DownloadResumeButton({ resumeId }: Props) {
  const t = useTranslations("jobs");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        {t("detail.editAndDownload")}
      </Button>
      {open && (
        <ResumeEditorOverlay
          resumeId={resumeId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
