"use client";

import { Title } from "@/components/ui";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";

interface ProfileTitleProps {
  pseudo: string;
  /** Server-streamed name, used when no preview was seeded on click. */
  streamedName: React.ReactNode;
  /** Server-streamed back button (depends on auth/ownership). */
  backSlot: React.ReactNode;
}

/**
 * Profile header row. When the visited profile was seeded by a UserCard click,
 * the name paints instantly from the preview store; otherwise it streams in
 * from the server. The back button always streams (it needs server auth).
 */
export function ProfileTitle({
  pseudo,
  streamedName,
  backSlot,
}: ProfileTitleProps) {
  const seeded = useProfilePreviewStore((s) => s.previews[pseudo]);

  return (
    <>
      {seeded ? (
        <Title
          label={`${seeded.first_name} ${seeded.last_name}`}
          size="h1"
        />
      ) : (
        streamedName
      )}
      {backSlot}
    </>
  );
}
