"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { API, ILLUSTRATIONS } from "@/constants";
import { profileToResumeJson } from "@/lib/resume/profileResume";
// Import the overlay from its file (not the jobs barrel): pulling this client
// tree through a barrel trips a Turbopack `export *` namespace-seal bug.
import { ResumeEditorOverlay } from "@/components/pages/jobs/collections/ResumeEditorOverlay";
import type { UserData } from "@/types";
import { ActionCard } from "./ActionCard";

interface DownloadCvCardProps {
  user: UserData;
}

/**
 * Home action that opens the resume editor seeded from the user's profile, then
 * lets them tweak it and download a CV PDF. No job analysis is involved — the
 * editor renders through the profile PDF route.
 */
export const DownloadCvCard = ({ user }: DownloadCvCardProps) => {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);

  // Seed the editor straight from the already-fetched profile (no round-trip).
  const initialDraft = useMemo(() => profileToResumeJson(user), [user]);

  return (
    <>
      <ActionCard
        actionLabel={t("actions.downloadCvTitle")}
        text={t("actions.downloadCvSubtitle")}
        description={t("actions.downloadCvDescription")}
        illustration={ILLUSTRATIONS.DOWNLOAD_RESUME}
        onClick={() => setOpen(true)}
        primary
      />
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
