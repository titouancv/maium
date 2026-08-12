"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { profileToResumeJson } from "@/lib/resume/profileResume";
// Import the overlay from its file (not the jobs barrel): pulling this client
// tree through a barrel trips a Turbopack `export *` namespace-seal bug.
import { ResumeEditorOverlay } from "@/components/pages/jobs/collections/ResumeEditorOverlay";
import { Button } from "@/components/ui";
import type { UserData } from "@/types";

interface ProfileDownloadCvButtonProps {
  user: UserData;
}

/**
 * Owner-only profile action: opens the resume editor seeded from the profile,
 * then lets the owner tweak it and download a CV PDF. No job analysis is
 * involved — the editor renders through the profile PDF route.
 */
export const ProfileDownloadCvButton = ({
  user,
}: ProfileDownloadCvButtonProps) => {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);

  // Seed the editor straight from the already-fetched profile (no round-trip).
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
