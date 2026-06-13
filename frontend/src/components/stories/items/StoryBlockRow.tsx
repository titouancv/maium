"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { StoryBlock, StoryBlockType } from "@/types/story";
import { BlockIcon } from "../storyBlockIcons";
import { Button, TextArea } from "@/components/ui";

const PLACEHOLDER_KEY: Record<StoryBlockType, string> = {
  heading: "blockHeadingPlaceholder",
  text: "blockTextPlaceholder",
  highlight: "blockHighlightPlaceholder",
  bullet: "blockBulletPlaceholder",
};

interface StoryBlockRowProps {
  block: StoryBlock;
  autoFocus: boolean;
  onChange: (text: string) => void;
  onChangeType: () => void;
}

/**
 * A single editable block: a left chip to change its type, an auto-growing
 * textarea typed by its kind, and a remove button revealed on hover/focus.
 */
export function StoryBlockRow({
  block,
  autoFocus,
  onChange,
  onChangeType,
}: StoryBlockRowProps) {
  const t = useTranslations("stories");
  const ref = useRef<HTMLTextAreaElement>(null);
  const singleLine = block.type === "heading";

  // Auto-grow the textarea to fit its content.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [block.text]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="group flex items-start gap-2">
      <Button
        type="button"
        onClick={onChangeType}
        aria-label={t("changeBlockType")}
        variant="outline"
        size="none"
        className="mt-1.5 h-7 w-7 shrink-0"
      >
        <BlockIcon type={block.type} />
      </Button>

      <div className="min-w-0 flex-1">
        <TextArea
          ref={ref}
          rows={1}
          value={block.text}
          enterKeyHint="done"
          placeholder={t(PLACEHOLDER_KEY[block.type])}
          onChange={(e) => {
            const value = singleLine
              ? e.target.value.replace(/\n/g, "")
              : e.target.value;
            onChange(value);
          }}
        />
      </div>
    </div>
  );
}
