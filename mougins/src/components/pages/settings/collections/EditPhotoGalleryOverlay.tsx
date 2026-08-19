"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FormLayout } from "@/components/layout";
import { Overlay } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
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

  const moveLeft = (index: number) => {
    if (index === 0) return;
    const next = [...photos];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    void persistOrder(next);
  };

  const moveRight = (index: number) => {
    if (index === photos.length - 1) return;
    const next = [...photos];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    void persistOrder(next);
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
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={photo.id} className="flex flex-col gap-2">
                  <div className="bg-surface-100 relative aspect-square overflow-hidden rounded-sm">
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 to-transparent" />
                    <button
                      type="button"
                      onClick={() => handleRemove(photo.id)}
                      aria-label={t("removePhotoAriaLabel")}
                      className="text-on-primary absolute top-1 right-1 flex size-6 items-center justify-center"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                  <div className="flex justify-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveLeft(index)}
                      aria-label={tCommon("previousOption")}
                      className="enabled:hover:text-primary flex size-6 items-center justify-center rounded-full disabled:opacity-30"
                    >
                      <Icon name="chevronLeft" size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1}
                      onClick={() => moveRight(index)}
                      aria-label={tCommon("nextOption")}
                      className="enabled:hover:text-primary flex size-6 items-center justify-center rounded-full disabled:opacity-30"
                    >
                      <Icon name="chevronRight" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
