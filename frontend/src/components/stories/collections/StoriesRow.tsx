"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useStoriesStore } from "@/stores/useStoriesStore";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import type { StoryGroup } from "@/types/story";
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
  const currentUser = useCurrentUserStore((s) => s.user);

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

  // The viewer's own group (always sorted first by the server). The "+ add
  // story" card is rendered next to it, inside that StoryBubble.
  const ownGroupIndex = groups.findIndex(
    (g) => g.stories[0]?.authorId === currentUser?.id,
  );

  // Owner with no story yet: there's no server group to attach to, so render a
  // dimmed placeholder of their own card whose click opens the creation overlay.
  const ownerPlaceholder: StoryGroup | null =
    ownGroupIndex === -1 && currentUser
      ? {
          author: {
            pseudo: currentUser.pseudo,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            location: currentUser.location,
          },
          stories: [],
          hasUnseen: false,
        }
      : null;

  return (
    <div className="flex items-start gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ownerPlaceholder && (
        <StoryBubble
          group={ownerPlaceholder}
          onOpen={() => setIsCreating(true)}
          onAddStory={() => setIsCreating(true)}
          isEmptyOwner
        />
      )}
      {groups.map((group, i) => (
        <StoryBubble
          key={group.author.pseudo}
          group={group}
          onOpen={() => openReader(i)}
          onAddStory={
            i === ownGroupIndex ? () => setIsCreating(true) : undefined
          }
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
