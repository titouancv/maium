"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { profileToResumeJson } from "@/lib/resume/profileResume";
import { ResumeEditorOverlay } from "@/components/pages/jobs/collections/ResumeEditorOverlay";
import { Button } from "@/components/ui";
import type { UserData } from "@/types";

interface ProfileDownloadCvButtonProps {
  user: UserData;
}

export const ProfileDownloadCvButton = ({
  user,
}: ProfileDownloadCvButtonProps) => {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);

  const initialDraft = useMemo(() => profileToResumeJson(user), [user]);

  return (
    <>
      <Button
        variant="primary"
        type="button"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        {t("downloadCvButton")}
      </Button>
      {open && (
        <ResumeEditorOverlay
          initialDraft={initialDraft}
          pdfEndpoint={API.RESUME_PROFILE_PDF}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
