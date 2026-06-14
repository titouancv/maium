"use client";

import { useTranslations } from "next-intl";
import type { StoryBlockType } from "@/types/story";
import { FormLayout } from "@/components/layout/FormLayout";
import { TabsVertical } from "@/components/ui/TabsVertical";
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
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <>
      {open && (
        <div className="bg-surface-50 fixed inset-0 z-50">
          <FormLayout
            title={t("blockMenuTitle")}
            isCancelable
            onCancel={onClose}
            step={1}
            totalSteps={1}
            cancelLabel={tCommon("backButton")}
            primaryLabel={t("addBlock")}
            onPrimary={() => onSelect(BLOCK_TYPES[tabIndex])}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex flex-col gap-6">
                <TabsVertical
                  tabs={BLOCK_TYPES.map((type) => t(LABEL_KEY[type]))}
                  activeTab={tabIndex}
                  onChange={setTabIndex}
                />
                <p className="text-txt-muted text-sm">
                  {t(DESC_KEY[BLOCK_TYPES[tabIndex]])}
                </p>
              </div>
              {showRemove && (
                <Button variant="outline" onClick={onRemove}>
                  {t("removeBlock")}
                </Button>
              )}
            </div>
          </FormLayout>
        </div>
      )}
    </>
  );
}
