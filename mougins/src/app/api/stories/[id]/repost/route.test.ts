import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { POST, DELETE } from "./route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function makeRequest(method: "POST" | "DELETE") {
  return new NextRequest("http://localhost/api/stories/orig-1/repost", {
    method,
  });
}

const params = Promise.resolve({ id: "orig-1" });

interface SetupOptions {
  userId: string | null;
  /** Row returned by the original-story lookup (selects `author_id`). */
  original?: { id: string; author_id: string; content: string } | null;
  /** Existing repost row returned by the duplicate guard (selects `id` only). */
  existing?: { id: string } | null;
  /** Row returned by the insert. */
  inserted?: unknown;
  insertError?: unknown;
  /** Row returned by the delete (the removed repost). */
  deleted?: { id: string } | null;
}

/**
 * Single chainable query-builder stub shared across the route's sequential
 * `from("stories")` calls. The terminal result is chosen from the current
 * `mode` (insert / delete / select) and, for selects, whether `author_id` is in
 * the requested columns (original lookup) or not (the duplicate guard).
 */
function setup(opts: SetupOptions) {
  let mode: "select" | "insert" | "delete" = "select";
  let selectCols = "";

  const resolveResult = () => {
    if (mode === "insert")
      return { data: opts.inserted ?? null, error: opts.insertError ?? null };
    if (mode === "delete") return { data: opts.deleted ?? null, error: null };
    if (selectCols.includes("author_id"))
      return { data: opts.original ?? null, error: null };
    return { data: opts.existing ?? null, error: null };
  };

  const builder: Record<string, unknown> = {
    select: vi.fn((cols?: string) => {
      selectCols = cols ?? "";
      return builder;
    }),
    insert: vi.fn(() => {
      mode = "insert";
      return builder;
    }),
    delete: vi.fn(() => {
      mode = "delete";
      return builder;
    }),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(resolveResult())),
    maybeSingle: vi.fn(() => Promise.resolve(resolveResult())),
  };

  const from = vi.fn(() => {
    mode = "select";
    selectCols = "";
    return builder;
  });

  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: opts.userId ? { id: opts.userId } : null } }),
    },
    from,
  } as never);

  return { builder };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/stories/[id]/repost", () => {
  it("401s when unauthenticated", async () => {
    setup({ userId: null });
    const res = await POST(makeRequest("POST"), { params });
    expect(res.status).toBe(401);
  });

  it("404s when the original story is not visible", async () => {
    setup({ userId: "me", original: null });
    const res = await POST(makeRequest("POST"), { params });
    expect(res.status).toBe(404);
  });

  it("400s when reposting your own story", async () => {
    setup({
      userId: "me",
      original: { id: "orig-1", author_id: "me", content: "mine" },
    });
    const res = await POST(makeRequest("POST"), { params });
    expect(res.status).toBe(400);
  });

  it("409s when the viewer has already reposted the story", async () => {
    setup({
      userId: "me",
      original: { id: "orig-1", author_id: "bob", content: "bob's story" },
      existing: { id: "rp-1" },
    });
    const res = await POST(makeRequest("POST"), { params });
    expect(res.status).toBe(409);
  });

  it("creates a repost referencing the original story and author", async () => {
    const { builder } = setup({
      userId: "me",
      original: { id: "orig-1", author_id: "bob", content: "bob's story" },
      existing: null,
      inserted: {
        id: "new-1",
        author_id: "me",
        content: "bob's story",
        is_repost: true,
        original_author_id: "bob",
        original_story_id: "orig-1",
        created_at: "2026-06-10T12:00:00Z",
        original_author: { pseudo: "bob", first_name: "Bob", last_name: "B" },
      },
    });

    const res = await POST(makeRequest("POST"), { params });
    expect(res.status).toBe(201);

    expect(builder.insert).toHaveBeenCalledWith({
      author_id: "me",
      content: "bob's story",
      is_repost: true,
      original_author_id: "bob",
      original_story_id: "orig-1",
    });

    const body = await res.json();
    expect(body.story).toMatchObject({
      id: "new-1",
      isRepost: true,
      originalAuthorId: "bob",
      originalStoryId: "orig-1",
      originalAuthor: { pseudo: "bob", first_name: "Bob", last_name: "B" },
      repostedByMe: false,
    });
  });
});

describe("DELETE /api/stories/[id]/repost", () => {
  it("401s when unauthenticated", async () => {
    setup({ userId: null });
    const res = await DELETE(makeRequest("DELETE"), { params });
    expect(res.status).toBe(401);
  });

  it("404s when the viewer has no repost of the story", async () => {
    setup({ userId: "me", deleted: null });
    const res = await DELETE(makeRequest("DELETE"), { params });
    expect(res.status).toBe(404);
  });

  it("removes the viewer's repost and returns its id", async () => {
    setup({ userId: "me", deleted: { id: "rp-1" } });
    const res = await DELETE(makeRequest("DELETE"), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "rp-1" });
  });
});
