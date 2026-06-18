"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Title, Markdown } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import type { StoryBlock, StoryBlockType } from "@/types/story";
import { StoryBlockRow } from "../items/StoryBlockRow";
import { StoryBlockTypeSheet } from "./StoryBlockTypeSheet";

interface StoryBlockEditorProps {
  onCancel: () => void;
  /** Receives the markdown-serialized story body. */
  onPublish: (markdown: string) => void;
  isPublishing: boolean;
  error?: string;
}

let blockSeq = 0;
const newBlock = (type: StoryBlockType): StoryBlock => ({
  id: `b${++blockSeq}`,
  type,
  text: "",
});

/**
 * Turn the editor blocks into the markdown string stored as `StoryData.content`
 * and rendered by `<Markdown>`. Empty blocks are dropped; blocks are separated
 * by a blank line so each becomes its own markdown element.
 */
function serializeBlocks(blocks: StoryBlock[]): string {
  return blocks
    .map((block) => {
      const text = block.text.trim();
      if (!text) return "";
      switch (block.type) {
        case "heading":
          // Headings are single-line in markdown; collapse any stray newlines.
          return `## ${text.replace(/\s*\n\s*/g, " ")}`;
        case "highlight":
          return text
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "bullet":
          return text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => `- ${line}`)
            .join("\n");
        case "text":
        default:
          return text;
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Notion-like block editor for composing a story. Each block is a typed text
 * area (title / text / highlight / bullet list); an "Add" button next to
 * "Publish" opens a bottom-sheet picker to append a block, and each block's
 * left chip reopens it to change that block's type or remove it. The whole
 * thing serializes to markdown on publish, so nothing downstream changes.
 */
export function StoryBlockEditor({
  onCancel,
  onPublish,
  isPublishing,
  error,
}: StoryBlockEditorProps) {
  const t = useTranslations("stories");
  const tCommon = useTranslations("common");

  const [blocks, setBlocks] = useState<StoryBlock[]>(() => [
    newBlock("heading"),
  ]);
  // null target → the menu adds a new block; an id → it edits that block's type.
  const [menuTarget, setMenuTarget] = useState<string | null | undefined>(
    undefined,
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const markdown = serializeBlocks(blocks);
  const hasContent = markdown.length > 0;
  const menuOpen = menuTarget !== undefined;

  const updateBlock = (id: string, text: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));

  const removeBlock = (id: string) =>
    setBlocks((prev) =>
      prev.length > 1 ? prev.filter((b) => b.id !== id) : prev,
    );

  const handleSelectType = (type: StoryBlockType) => {
    if (menuTarget) {
      // Change an existing block's type.
      setBlocks((prev) =>
        prev.map((b) => (b.id === menuTarget ? { ...b, type } : b)),
      );
    } else {
      // Append a new block and focus it.
      const block = newBlock(type);
      setBlocks((prev) => [...prev, block]);
      setFocusId(block.id);
    }
    setMenuTarget(undefined);
  };

  const handlePublish = () => {
    if (!hasContent || isPublishing) return;
    onPublish(markdown);
  };

  return (
    <div className="flex h-dvh flex-col md:h-screen md:items-center md:justify-center">
      <div className="flex h-full w-full flex-col md:h-screen md:max-w-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-6 pb-6 md:pt-12">
          <Title label={t("createTitle")} size="h1" />
          <Button variant="ghost" type="button" size="none" onClick={onCancel}>
            {tCommon("cancelButton")}
          </Button>
        </div>

        {/* Blocks (edit) / rendered story (preview) */}
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-64">
          {isPreview ? (
            <Markdown>{markdown}</Markdown>
          ) : (
            blocks.map((block) => (
              <StoryBlockRow
                key={block.id}
                block={block}
                autoFocus={block.id === focusId}
                onChange={(text) => updateBlock(block.id, text)}
                onChangeType={() => setMenuTarget(block.id)}
              />
            ))
          )}
          {!isPreview && (
            <Button
              variant="outline"
              type="button"
              size="lg"
              onClick={() => setMenuTarget(null)}
            >
              <span className="flex items-center gap-1.5">{t("addBlock")}</span>
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-6 md:pb-12">
          {error && <p className="text-error mb-2 text-sm">{error}</p>}
          <div className="flex gap-2">
            {isPreview && (
              <Button
                variant="outline"
                type="button"
                size="lg"
                onClick={() => setIsPreview(false)}
              >
                {tCommon("backButton")}
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              className="flex-1"
              isLoading={isPublishing}
              onClick={isPreview ? handlePublish : () => setIsPreview(true)}
              disabled={!hasContent}
            >
              {isPreview ? t("publish") : tCommon("nextButton")}
            </Button>
          </div>
        </div>
      </div>

      <StoryBlockTypeSheet
        open={menuOpen}
        showRemove={typeof menuTarget === "string"}
        onSelect={handleSelectType}
        onRemove={() => {
          if (typeof menuTarget === "string") removeBlock(menuTarget);
          setMenuTarget(undefined);
        }}
        onClose={() => setMenuTarget(undefined)}
      />
    </div>
  );
}
