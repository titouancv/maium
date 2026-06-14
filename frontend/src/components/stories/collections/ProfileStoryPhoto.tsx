"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { ProfilePhoto } from "@/components/ui";
import { useStoriesStore } from "@/stores/useStoriesStore";
import type { StoryGroup } from "@/types/story";
import { StoryBubble } from "../items/StoryBubble";

// The reader pulls in react-markdown; only load it once the photo is tapped so
// it stays out of the profile bundle.
const StoryReaderOverlay = dynamic(
  () => import("./StoryReaderOverlay").then((m) => m.StoryReaderOverlay),
  { ssr: false },
);

interface ProfileStoryPhotoProps {
  /** The profile's stories grouped (null when none are visible to the viewer). */
  storiesPromise: Promise<StoryGroup | null>;
  pseudo: string;
  displayName?: { firstName: string; lastName: string };
}

/**
 * Profile avatar that doubles as a story bubble: when the viewed profile has
 * stories visible to the current viewer, the photo gains the (muted-when-seen)
 * story ring and opens the reader scoped to that single author. With no stories
 * it renders a plain {@link ProfilePhoto}, so the aside never shifts.
 */
export function ProfileStoryPhoto({
  storiesPromise,
  pseudo,
  displayName,
}: ProfileStoryPhotoProps) {
  const group = use(storiesPromise);
  const hydrate = useStoriesStore((s) => s.hydrate);
  // Read the live group back from the store so the ring mutes once every story
  // has been seen (the reader marks them seen as the viewer pages through).
  const storedGroup = useStoriesStore((s) =>
    s.groups.find((g) => g.author.pseudo === pseudo),
  );
  const [readerOpen, setReaderOpen] = useState(false);

  // Seed the shared stories store with just this author's group; the reader
  // then navigates within it and closes at the last story.
  useEffect(() => {
    if (group) hydrate([group]);
  }, [group, hydrate]);

  if (!group) return <ProfilePhoto pseudo={pseudo} displayName={displayName} />;

  const liveGroup = storedGroup ?? group;
  const firstUnseen = liveGroup.stories.findIndex((s) => !s.seen);

  return (
    <>
      <StoryBubble
        group={liveGroup}
        onOpen={() => setReaderOpen(true)}
        className="w-full"
        hideName={!displayName}
      />

      <AnimatePresence>
        {readerOpen && (
          <StoryReaderOverlay
            start={{
              groupIndex: 0,
              storyIndex: firstUnseen === -1 ? 0 : firstUnseen,
            }}
            onClose={() => setReaderOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
