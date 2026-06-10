import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/getCurrentUser", () => ({ getAuthUser: vi.fn() }));

import { getStoriesFeed } from "./server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/getCurrentUser";

const mockCreateClient = vi.mocked(createClient);
const mockGetAuthUser = vi.mocked(getAuthUser);

type Row = Record<string, unknown>;

/** A thenable, chainable query-builder stub that resolves to `result`. */
function chain(result: { data: unknown; error: unknown }) {
  const obj: Record<string, unknown> = {};
  for (const m of ["select", "gt", "order", "eq", "in"]) {
    obj[m] = vi.fn(() => obj);
  }
  obj.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return obj;
}

function mockSupabase(results: Record<string, { data: unknown; error: unknown }>) {
  mockCreateClient.mockResolvedValue({
    from: vi.fn((table: string) => chain(results[table])),
  } as never);
}

function storyRow(over: Partial<Row>): Row {
  return {
    id: "x",
    author_id: "me",
    content: "hello",
    is_repost: false,
    original_author_id: null,
    original_story_id: null,
    created_at: "2026-06-10T08:00:00Z",
    original_author: null,
    author: { pseudo: "me", first_name: "Me", last_name: "Self" },
    ...over,
  };
}

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

    const bobAuthor = { pseudo: "bob", first_name: "Bob", last_name: "B" };
    mockSupabase({
      stories: {
        data: [
          storyRow({ id: "a1", created_at: "2026-06-10T08:00:00Z" }),
          storyRow({
            id: "b1",
            author_id: "b",
            author: bobAuthor,
            created_at: "2026-06-10T09:00:00Z",
          }),
          storyRow({
            id: "b2",
            author_id: "b",
            author: bobAuthor,
            created_at: "2026-06-10T10:00:00Z",
          }),
        ],
        error: null,
      },
      // a1 and b1 already seen; b2 unseen.
      story_views: { data: [{ story_id: "a1" }, { story_id: "b1" }], error: null },
      story_likes: { data: [], error: null },
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
});
