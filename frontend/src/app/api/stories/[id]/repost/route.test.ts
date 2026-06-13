import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

function makeRequest() {
  return new NextRequest("http://localhost/api/stories/orig-1/repost", {
    method: "POST",
  });
}

const params = Promise.resolve({ id: "orig-1" });

interface SetupOptions {
  userId: string | null;
  original: { id: string; author_id: string; content: string } | null;
  insertResult?: { data: unknown; error: unknown };
}

function setup({ userId, original, insertResult }: SetupOptions) {
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue(
        insertResult ?? {
          data: {
            id: "new-1",
            author_id: userId,
            content: original?.content,
            is_repost: true,
            original_author_id: original?.author_id,
            original_story_id: original?.id,
            created_at: "2026-06-10T12:00:00Z",
            original_author: { pseudo: "bob", first_name: "Bob", last_name: "B" },
          },
          error: null,
        },
      ),
    })),
  }));

  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: original, error: null }),
        })),
      })),
      insert,
    })),
  } as never);

  return { insert };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/stories/[id]/repost", () => {
  it("401s when unauthenticated", async () => {
    setup({ userId: null, original: null });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(401);
  });

  it("404s when the original story is not visible", async () => {
    setup({ userId: "me", original: null });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(404);
  });

  it("400s when reposting your own story", async () => {
    setup({
      userId: "me",
      original: { id: "orig-1", author_id: "me", content: "mine" },
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(400);
  });

  it("creates a repost referencing the original story and author", async () => {
    const { insert } = setup({
      userId: "me",
      original: { id: "orig-1", author_id: "bob", content: "bob's story" },
    });

    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(201);

    expect(insert).toHaveBeenCalledWith({
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
    });
  });
});
