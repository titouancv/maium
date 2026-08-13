"use client";

import { Title } from "@/components/ui";
import { useProfilePreviewStore } from "@/stores/useProfilePreviewStore";

interface ProfileTitleProps {
  pseudo: string;
  streamedName: React.ReactNode;
  backSlot: React.ReactNode;
}

export function ProfileTitle({
  pseudo,
  streamedName,
  backSlot,
}: ProfileTitleProps) {
  const seeded = useProfilePreviewStore((s) => s.previews[pseudo]);

  return (
    <div className="flex w-full justify-end md:justify-between">
      {seeded ? (
        <div className="hidden md:flex">
          <Title label={`${seeded.first_name} ${seeded.last_name}`} size="h1" />
        </div>
      ) : (
        streamedName
      )}
      {backSlot}
    </div>
  );
}
