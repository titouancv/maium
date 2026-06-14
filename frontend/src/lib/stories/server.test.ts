import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/getCurrentUser", () => ({ getAuthUser: vi.fn() }));

import { getStoriesFeed } from "./server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/getCurrentUser";

const mockCreateClient = vi.mocked(createClient);
const mockGetAuthUser = vi.mocked(getAuthUser);

type Row = Record<string, unknown>;

/** Stub a client whose `get_stories_feed` RPC resolves to `result`. */
function mockRpc(result: { data: unknown; error: unknown }) {
  mockCreateClient.mockResolvedValue({
    rpc: vi.fn(() => Promise.resolve(result)),
  } as never);
}

/** A flat `get_stories_feed` row with sensible defaults, overridable per case. */
function feedRow(over: Partial<Row>): Row {
  return {
    id: "x",
    author_id: "me",
    content: "hello",
    is_repost: false,
    original_author_id: null,
    original_story_id: null,
    created_at: "2026-06-10T08:00:00Z",
    like_count: 0,
    repost_count: 0,
    author_pseudo: "me",
    author_first_name: "Me",
    author_last_name: "Self",
    author_location: null,
    original_author_pseudo: null,
    original_author_first_name: null,
    original_author_last_name: null,
    seen: false,
    liked_by_me: false,
    reposted_by_me: false,
    viewers: null,
    ...over,
  };
}

const bob = {
  author_id: "b",
  author_pseudo: "bob",
  author_first_name: "Bob",
  author_last_name: "B",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getStoriesFeed", () => {
  it("returns [] when signed out", async () => {
    mockGetAuthUser.mockResolvedValue(null as never);
    expect(await getStoriesFeed()).toEqual([]);
  });

  it("groups by author, puts the viewer's own group first, and marks unseen", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "me" } as never);

    mockRpc({
      data: [
        // a1 and b1 already seen; b2 unseen.
        feedRow({ id: "a1", seen: true, created_at: "2026-06-10T08:00:00Z" }),
        feedRow({ ...bob, id: "b1", seen: true, created_at: "2026-06-10T09:00:00Z" }),
        feedRow({ ...bob, id: "b2", seen: false, created_at: "2026-06-10T10:00:00Z" }),
      ],
      error: null,
    });

    const feed = await getStoriesFeed();

    expect(feed).toHaveLength(2);
    // Own group first even though Bob has the most recent story.
    expect(feed[0].author.pseudo).toBe("me");
    expect(feed[0].hasUnseen).toBe(false);
    // Bob's group keeps stories oldest-first and is flagged unseen (b2).
    expect(feed[1].author.pseudo).toBe("bob");
    expect(feed[1].stories.map((s) => s.id)).toEqual(["b1", "b2"]);
    expect(feed[1].hasUnseen).toBe(true);
    expect(feed[1].stories[1].seen).toBe(false);
  });

  it("carries per-story like and repost counts from the feed row", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "me" } as never);

    mockRpc({
      data: [
        feedRow({ id: "a1", like_count: 2, repost_count: 1 }),
        feedRow({ id: "a2", created_at: "2026-06-10T09:00:00Z" }),
      ],
      error: null,
    });

    const feed = await getStoriesFeed();
    const stories = feed[0].stories;
    const a1 = stories.find((s) => s.id === "a1")!;
    const a2 = stories.find((s) => s.id === "a2")!;

    expect(a1.likeCount).toBe(2);
    expect(a1.repostCount).toBe(1);
    expect(a2.likeCount).toBe(0);
    expect(a2.repostCount).toBe(0);
  });

  it("carries the embedded viewers from the feed row (empty when null)", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "me" } as never);

    const viewer = {
      pseudo: "alice",
      first_name: "Alice",
      last_name: "A",
      location: null,
      liked: true,
      reposted: false,
    };

    mockRpc({
      data: [
        feedRow({ id: "a1", viewers: [viewer] }),
        feedRow({ id: "a2", created_at: "2026-06-10T09:00:00Z", viewers: null }),
      ],
      error: null,
    });

    const stories = (await getStoriesFeed())[0].stories;
    expect(stories.find((s) => s.id === "a1")!.viewers).toEqual([viewer]);
    // A null viewers column (others' stories) maps to an empty list.
    expect(stories.find((s) => s.id === "a2")!.viewers).toEqual([]);
  });
});
