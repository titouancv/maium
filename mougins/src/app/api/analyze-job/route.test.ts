import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, after: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/jobs/usage", () => ({
  isUnderRateLimit: vi.fn().mockResolvedValue(true),
  isAnonUnderQuota: vi.fn().mockResolvedValue(true),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/jobs/pipeline", () => ({
  runAnalysisPipeline: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAnonUnderQuota, isUnderRateLimit } from "@/lib/jobs/usage";
import { ANON_USED_COOKIE } from "@/constants";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdmin = vi.mocked(createAdminClient);
const mockRateLimit = vi.mocked(isUnderRateLimit);
const mockAnonQuota = vi.mocked(isAnonUnderQuota);

const CV_EXTRACTION = {
  firstName: "Ada",
  skills: ["TypeScript"],
  professionalExperiences: [
    {
      organization: "Acme",
      role: "Engineer",
      startPeriod: Date.UTC(2020, 0, 1),
    },
  ],
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/analyze-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.7",
      ...headers,
    },
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
    cookieJar.clear();
    mockRateLimit.mockResolvedValue(true);
    mockAnonQuota.mockResolvedValue(true);
  });

  it("returns 400 for an invalid URL", async () => {
    mockAuth("user-1");
    const res = await POST(makeRequest({ mode: "url", jobUrl: "not-a-url" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for text mode with too-short content", async () => {
    mockAuth("user-1");
    const res = await POST(makeRequest({ mode: "text", jobText: "too short" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when over the rate limit", async () => {
    mockAuth("user-1");
    mockRateLimit.mockResolvedValue(false);
    const res = await POST(makeRequest({ mode: "url", jobUrl: "https://example.com/job" }));
    expect(res.status).toBe(429);
  });

  it("returns 202 with the queued analysis id on success (url mode)", async () => {
    mockAuth("user-1");
    mockAdminInsert({ data: { id: "analysis-1" }, error: null });
    const res = await POST(makeRequest({ mode: "url", jobUrl: "https://example.com/job" }));
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json).toEqual({ analysisId: "analysis-1", status: "queued" });
  });

  it("returns 202 with the queued analysis id on success (text mode)", async () => {
    mockAuth("user-1");
    mockAdminInsert({ data: { id: "analysis-2" }, error: null });
    const res = await POST(
      makeRequest({ mode: "text", jobText: "A".repeat(50) }),
    );
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json).toEqual({ analysisId: "analysis-2", status: "queued" });
  });

  describe("signed out", () => {
    it("runs the analysis when a parsed CV is supplied", async () => {
      mockAuth(null);
      mockAdminInsert({ data: { id: "analysis-3" }, error: null });
      const res = await POST(
        makeRequest({
          mode: "url",
          jobUrl: "https://example.com/job",
          cvExtraction: CV_EXTRACTION,
        }),
      );
      expect(res.status).toBe(202);
    });

    it("returns 400 without a CV, having no profile to match against", async () => {
      mockAuth(null);
      const res = await POST(
        makeRequest({ mode: "url", jobUrl: "https://example.com/job" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for a CV that fails validation", async () => {
      mockAuth(null);
      const res = await POST(
        makeRequest({
          mode: "url",
          jobUrl: "https://example.com/job",
          cvExtraction: { ...CV_EXTRACTION, skills: [{ evil: true }] },
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 402 once the free run has been spent", async () => {
      mockAuth(null);
      cookieJar.set(ANON_USED_COOKIE, "1");
      const res = await POST(
        makeRequest({
          mode: "url",
          jobUrl: "https://example.com/job",
          cvExtraction: CV_EXTRACTION,
        }),
      );
      expect(res.status).toBe(402);
      expect(await res.json()).toEqual({ error: "anon_quota_exhausted" });
    });

    it("returns 402 when the server-side quota refuses", async () => {
      mockAuth(null);
      mockAnonQuota.mockResolvedValue(false);
      const res = await POST(
        makeRequest({
          mode: "url",
          jobUrl: "https://example.com/job",
          cvExtraction: CV_EXTRACTION,
        }),
      );
      expect(res.status).toBe(402);
    });

    it("refuses a request with no attributable IP", async () => {
      mockAuth(null);
      const req = new NextRequest("http://localhost/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "url",
          jobUrl: "https://example.com/job",
          cvExtraction: CV_EXTRACTION,
        }),
      });
      expect((await POST(req)).status).toBe(403);
    });

    it("marks the free run spent so the next one is refused", async () => {
      mockAuth(null);
      mockAdminInsert({ data: { id: "analysis-4" }, error: null });
      const body = {
        mode: "url",
        jobUrl: "https://example.com/job",
        cvExtraction: CV_EXTRACTION,
      };
      expect((await POST(makeRequest(body))).status).toBe(202);
      expect((await POST(makeRequest(body))).status).toBe(402);
    });
  });

  it("ignores a CV posted by a signed-in caller, whose profile wins", async () => {
    mockAuth("user-1");
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "a" }, error: null }),
      }),
    });
    mockCreateAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({ insert }),
    } as never);

    await POST(
      makeRequest({
        mode: "url",
        jobUrl: "https://example.com/job",
        cvExtraction: CV_EXTRACTION,
      }),
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", cv_extraction: null }),
    );
  });
});
