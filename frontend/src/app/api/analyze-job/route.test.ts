import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/jobs/usage", () => ({
  isUnderRateLimit: vi.fn().mockResolvedValue(true),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/jobs/pipeline", () => ({
  runAnalysisPipeline: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUnderRateLimit } from "@/lib/jobs/usage";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdmin = vi.mocked(createAdminClient);
const mockRateLimit = vi.mocked(isUnderRateLimit);

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/analyze-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockAuth(userId: string | null) {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
  } as never);
}

function mockAdminInsert(result: { data: { id: string } | null; error: unknown }) {
  mockCreateAdmin.mockReturnValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  } as never);
}

describe("POST /api/analyze-job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(true);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth(null);
    const res = await POST(makeRequest({ jobUrl: "https://example.com/job" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid URL", async () => {
    mockAuth("user-1");
    const res = await POST(makeRequest({ jobUrl: "not-a-url" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when over the rate limit", async () => {
    mockAuth("user-1");
    mockRateLimit.mockResolvedValue(false);
    const res = await POST(makeRequest({ jobUrl: "https://example.com/job" }));
    expect(res.status).toBe(429);
  });

  it("returns 202 with the queued analysis id on success", async () => {
    mockAuth("user-1");
    mockAdminInsert({ data: { id: "analysis-1" }, error: null });
    const res = await POST(makeRequest({ jobUrl: "https://example.com/job" }));
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json).toEqual({ analysisId: "analysis-1", status: "queued" });
  });
});
