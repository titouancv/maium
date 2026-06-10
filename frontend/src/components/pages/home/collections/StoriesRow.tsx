"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useStoriesStore } from "@/stores/useStoriesStore";
import type { StoryGroup } from "@/types/story";
import { AddStoryBubble } from "../items/AddStoryBubble";
import { StoryBubble } from "../items/StoryBubble";

// The reader (pulls in react-markdown) and the creation form are only needed on
// interaction — load them lazily so they stay out of the home bundle.
const StoryReaderOverlay = dynamic(
  () => import("./StoryReaderOverlay").then((m) => m.StoryReaderOverlay),
  { ssr: false },
);
const CreateStoryOverlay = dynamic(
  () => import("./CreateStoryOverlay").then((m) => m.CreateStoryOverlay),
  { ssr: false },
);

interface StoriesRowProps {
  storiesPromise: Promise<StoryGroup[]>;
}

/** Position into the feed: which author group, which story within it. */
export interface StoryPosition {
  groupIndex: number;
  storyIndex: number;
}

export function StoriesRow({ storiesPromise }: StoriesRowProps) {
  const serverGroups = use(storiesPromise);
  const hydrate = useStoriesStore((s) => s.hydrate);
  const stored = useStoriesStore((s) => s.groups);

  // Reconcile the streamed (authoritative) feed into the shared store.
  useEffect(() => {
    hydrate(serverGroups);
  }, [serverGroups, hydrate]);

  // Render the store once hydrated; fall back to the streamed prop on first
  // paint so the row never flashes empty.
  const groups = stored.length > 0 ? stored : serverGroups;

  const [readerStart, setReaderStart] = useState<StoryPosition | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const openReader = (groupIndex: number) => {
    const group = groups[groupIndex];
    const firstUnseen = group.stories.findIndex((s) => !s.seen);
    setReaderStart({
      groupIndex,
      storyIndex: firstUnseen === -1 ? 0 : firstUnseen,
    });
  };

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <AddStoryBubble onClick={() => setIsCreating(true)} />
      {groups.map((group, i) => (
        <StoryBubble
          key={group.author.pseudo}
          group={group}
          onOpen={() => openReader(i)}
        />
      ))}

      <AnimatePresence>
        {readerStart && (
          <StoryReaderOverlay
            key="story-reader"
            start={readerStart}
            onClose={() => setReaderStart(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <CreateStoryOverlay
            key="story-create"
            onClose={() => setIsCreating(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
