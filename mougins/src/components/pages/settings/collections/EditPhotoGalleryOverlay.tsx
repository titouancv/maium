"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FormLayout } from "@/components/layout";
import { Overlay } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { ReorderableList } from "@/components/ui";
import { Text } from "@/components/ui/Text";
import { GalleryPhotoPicker } from "@/components/form/GalleryPhotoPicker";
import { useGalleryPhotoPicker } from "@/hooks/useGalleryPhotoPicker";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { API, PROFILE_GALLERY_MAX_PHOTOS } from "@/constants";
import type { UserPhoto } from "@/types/user";

interface Props {
  photos: UserPhoto[];
  onClose: () => void;
  onSaved: () => void;
}

export const EditPhotoGalleryOverlay = ({
  photos: initialPhotos,
  onClose,
  onSaved,
}: Props) => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const currentUserId = useCurrentUserStore((s) => s.user?.id);

  const [photos, setPhotos] = useState<UserPhoto[]>(initialPhotos);
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>();

  const picker = useGalleryPhotoPicker({
    userId: currentUserId,
    onAdded: ({ id, url }) => {
      setPhotos((prev) => [...prev, { id, url, position: prev.length }]);
      setIsAdding(false);
      onSaved();
    },
  });

  const errorLabel =
    picker.error === "type"
      ? t("profilePhotoErrorType")
      : picker.error === "size"
        ? t("profilePhotoErrorSize")
        : picker.error === "full"
          ? t("photoGalleryMaxReached")
          : picker.error === "upload"
            ? t("profilePhotoErrorUpload")
            : actionError;

  const persistOrder = async (next: UserPhoto[]) => {
    setPhotos(next);
    setActionError(undefined);
    const res = await fetch(API.USERS_ME_PHOTOS, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((p) => p.id) }),
    });
    if (!res.ok) {
      setActionError(t("profilePhotoErrorUpload"));
      return;
    }
    onSaved();
  };

  const handleRemove = async (id: string) => {
    setActionError(undefined);
    const res = await fetch(API.USERS_ME_PHOTO(id), { method: "DELETE" });
    if (!res.ok) {
      setActionError(t("profilePhotoErrorUpload"));
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    onSaved();
  };

  const canAdd = photos.length < PROFILE_GALLERY_MAX_PHOTOS;

  if (isAdding) {
    return (
      <Overlay
        onClose={() => {
          picker.reset();
          setIsAdding(false);
        }}
      >
        <FormLayout
          title={t("editPhotoGallery")}
          step={1}
          totalSteps={1}
          isCancelable
          onCancel={() => {
            picker.reset();
            setIsAdding(false);
          }}
          cancelLabel={tCommon("cancelButton")}
          primaryLabel={picker.hasImage ? t("saveButton") : undefined}
          primaryLoading={picker.isSaving}
          onPrimary={() => void picker.cropAndUpload()}
          error={errorLabel}
        >
          <GalleryPhotoPicker picker={picker} />
        </FormLayout>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <FormLayout
        title={t("editPhotoGallery")}
        step={1}
        totalSteps={1}
        isCancelable
        onCancel={onClose}
        cancelLabel={tCommon("closeButton")}
        error={actionError}
      >
        <div className="flex flex-col gap-6">
          {photos.length > 0 && (
            <ReorderableList
              items={photos}
              onReorder={setPhotos}
              onCommit={(next) => void persistOrder(next)}
              className="grid grid-cols-3 gap-3"
            >
              {(photo, _index, handleProps) => (
                <div className="flex flex-col gap-2">
                  <div className="bg-surface-100 relative aspect-square overflow-hidden rounded-sm">
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    {handleProps && (
                      <>
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent" />
                        <DragHandle
                          {...handleProps}
                          orientation="horizontal"
                          className="text-on-primary absolute inset-0 h-full w-full items-end justify-center pb-2"
                        />
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full px-2"
                    onClick={() => handleRemove(photo.id)}
                  >
                    {t("deleteButton")}
                  </Button>
                </div>
              )}
            </ReorderableList>
          )}

          {canAdd ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              {tCommon("addButton")}
            </Button>
          ) : (
            <Text tone="muted" size="sm">
              {t("photoGalleryMaxReached")}
            </Text>
          )}
        </div>
      </FormLayout>
    </Overlay>
  );
};
