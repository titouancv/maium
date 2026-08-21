"use client";

import { useTranslations } from "next-intl";
import { Button } from "../Button";
import { DragHandle } from "../DragHandle";
import { Text } from "../Text";
import {
  imageBackdropTheme,
  useImageTone,
  type DragHandleProps,
} from "@/hooks";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onEdit: () => void;
  dragProps?: DragHandleProps | null;
}

export const CompactItem = ({
  title,
  subtitle,
  imageUrl,
  onEdit,
  dragProps,
}: Props) => {
  const t = useTranslations("common");
  const tone = useImageTone(imageUrl);
  const isCutout = tone !== null;
  const { onKeyDown, ...pointerHandlers }: Partial<DragHandleProps> =
    dragProps ?? {};

  return (
    <div
      {...pointerHandlers}
      className={cn(
        "flex items-center gap-3 py-1",
        dragProps &&
          "group cursor-grab touch-none select-none active:cursor-grabbing",
      )}
    >
      {dragProps && <DragHandle onKeyDown={onKeyDown} />}
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            data-theme={imageBackdropTheme(tone)}
            className="bg-surface-50 text-txt relative size-10 shrink-0 overflow-hidden rounded-sm"
          >
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className={cn(
                  "absolute inset-0 h-full w-full",
                  isCutout ? "object-contain p-1" : "object-cover",
                )}
              />
            ) : (
              <span
                aria-hidden
                className="text-txt-muted/40 absolute inset-0 flex items-center justify-center text-lg leading-none font-extrabold"
              >
                {title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <Text
              truncate
              className="group-hover:text-primary transition-colors"
            >
              {title}
            </Text>
            {subtitle && (
              <Text tone="muted" size="sm" truncate>
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 cursor-pointer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onEdit}
        >
          {t("editButton")}
        </Button>
      </div>
    </div>
  );
};
