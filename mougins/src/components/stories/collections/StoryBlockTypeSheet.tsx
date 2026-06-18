"use client";

import { useTranslations } from "next-intl";
import type { StoryBlockType } from "@/types/story";
import { Form } from "@/components/form";
import { useState } from "react";
import { Button } from "@/components/ui";

const BLOCK_TYPES: StoryBlockType[] = [
  "heading",
  "text",
  "highlight",
  "bullet",
];

const LABEL_KEY: Record<StoryBlockType, string> = {
  heading: "blockHeading",
  text: "blockText",
  highlight: "blockHighlight",
  bullet: "blockBullet",
};

const DESC_KEY: Record<StoryBlockType, string> = {
  heading: "blockHeadingDesc",
  text: "blockTextDesc",
  highlight: "blockHighlightDesc",
  bullet: "blockBulletDesc",
};

interface StoryBlockTypeSheetProps {
  open: boolean;
  showRemove: boolean;
  onSelect: (type: StoryBlockType) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Bottom-sheet picker to append a block or change an existing block's type.
 * When editing an existing block (`showRemove`), it also offers to remove it.
 */
export function StoryBlockTypeSheet({
  open,
  showRemove,
  onSelect,
  onRemove,
  onClose,
}: StoryBlockTypeSheetProps) {
  const t = useTranslations("stories");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState<StoryBlockType>(BLOCK_TYPES[0]);

  return (
    <>
      {open && (
        <div className="bg-surface-50 fixed inset-0 z-50">
          <Form
            type="select"
            title={t("blockMenuTitle")}
            isCancelable
            onCancel={onClose}
            step={1}
            totalSteps={1}
            cancelLabel={tCommon("backButton")}
            primaryLabel={t("addBlock")}
            onPrimary={() => onSelect(selected)}
            options={BLOCK_TYPES.map((type) => ({
              value: type,
              label: t(LABEL_KEY[type]),
              description: t(DESC_KEY[type]),
            }))}
            defaultValue={BLOCK_TYPES[0]}
            onChange={(value) => setSelected(value as StoryBlockType)}
            footer={
              showRemove && (
                <Button variant="outline" onClick={onRemove}>
                  {t("removeBlock")}
                </Button>
              )
            }
          />
        </div>
      )}
    </>
  );
}
