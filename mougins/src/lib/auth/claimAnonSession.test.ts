import { describe, it, expect, vi, beforeEach } from "vitest";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/users/writeProfile", () => ({ writeProfile: vi.fn() }));

import { claimAnonSession } from "./claimAnonSession";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeProfile } from "@/lib/users/writeProfile";
import { ANON_SESSION_COOKIE, ANON_USED_COOKIE } from "@/constants";

const mockAdmin = vi.mocked(createAdminClient);
const mockWriteProfile = vi.mocked(writeProfile);

const ANON_ID = "b630f0ca-746d-483d-b3ae-eb6af32c680b";
const USER_ID = "902fca5e-a60a-4fee-a398-140a9394d858";

const CV_EXTRACTION = {
  firstName: "Ada",
  lastName: "Lovelace",
  bio: "Backend engineer.",
  skills: ["TypeScript"],
  professionalExperiences: [
    { organization: "Acme", role: "Engineer", startPeriod: Date.UTC(2020, 0, 1) },
  ],
};

const EMPTY_PROFILE = {
  onboarding_completed: false,
  phone: null,
  nationality: null,
  location: null,
  bio: null,
  user_experiences: [],
  user_skills: [],
  user_projects: [],
  user_social_networks: [],
  user_hobbies: [],
};

function mockDb(
  cvExtraction: unknown,
  profile: Record<string, unknown> | null = EMPTY_PROFILE,
  profileError: unknown = null,
) {
  const updates: { table: string; patch: Record<string, unknown>; anonId: string }[] = [];

  mockAdmin.mockReturnValue({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: profile, error: profileError }),
          not: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: cvExtraction ? { cv_extraction: cvExtraction } : null,
                }),
              }),
            }),
          }),
        }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async (_col: string, anonId: string) => {
          updates.push({ table, patch, anonId });
          return { error: null };
        },
      }),
    }),
  } as never);

  return updates;
}

describe("claimAnonSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieJar.clear();
    cookieJar.set(ANON_SESSION_COOKIE, ANON_ID);
    cookieJar.set(ANON_USED_COOKIE, "1");
  });

  it("does nothing when the visitor has no session cookie", async () => {
    cookieJar.clear();
    const updates = mockDb(CV_EXTRACTION);
    await claimAnonSession(USER_ID);
    expect(mockWriteProfile).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
  });

  it("writes the parsed CV onto the new profile", async () => {
    mockDb(CV_EXTRACTION);
    await claimAnonSession(USER_ID);

    expect(mockWriteProfile).toHaveBeenCalledTimes(1);
    const [, userId, patch] = mockWriteProfile.mock.calls[0];
    expect(userId).toBe(USER_ID);
    expect(patch).toMatchObject({
      bio: "Backend engineer.",
      skills: ["TypeScript"],
    });
    expect(patch.professionalExperiences).toHaveLength(1);
  });

  it("does not carry over the CV's first and last name", async () => {
    mockDb(CV_EXTRACTION);
    await claimAnonSession(USER_ID);

    const [, , patch] = mockWriteProfile.mock.calls[0];
    expect(patch).not.toHaveProperty("firstName");
    expect(patch).not.toHaveProperty("lastName");
  });

  it("leaves an onboarded account's profile untouched", async () => {
    const updates = mockDb(CV_EXTRACTION, {
      ...EMPTY_PROFILE,
      onboarding_completed: true,
    });
    await claimAnonSession(USER_ID);

    expect(mockWriteProfile).not.toHaveBeenCalled();
    expect(updates).toHaveLength(3);
  });

  it("fills only the gaps of a half-finished profile", async () => {
    mockDb(CV_EXTRACTION, {
      ...EMPTY_PROFILE,
      bio: "Written by hand.",
      user_skills: [{ name: "Go" }],
    });
    await claimAnonSession(USER_ID);

    const [, , patch] = mockWriteProfile.mock.calls[0];
    expect(patch).not.toHaveProperty("bio");
    expect(patch).not.toHaveProperty("skills");
    expect(patch.professionalExperiences).toHaveLength(1);
  });

  it("keeps experiences the account already has, per type", async () => {
    mockDb(CV_EXTRACTION, {
      ...EMPTY_PROFILE,
      user_experiences: [{ type: "professional" }],
    });
    await claimAnonSession(USER_ID);

    const [, , patch] = mockWriteProfile.mock.calls[0];
    expect(patch).not.toHaveProperty("professionalExperiences");
    expect(patch).toMatchObject({ skills: ["TypeScript"] });
  });

  it("writes nothing when every field is already filled", async () => {
    const updates = mockDb(CV_EXTRACTION, {
      ...EMPTY_PROFILE,
      bio: "Written by hand.",
      user_skills: [{ name: "Go" }],
      user_experiences: [{ type: "professional" }],
    });
    await claimAnonSession(USER_ID);

    expect(mockWriteProfile).not.toHaveBeenCalled();
    expect(updates).toHaveLength(3);
  });

  it("skips the import when the profile can't be read", async () => {
    const updates = mockDb(CV_EXTRACTION, null, { message: "boom" });
    await claimAnonSession(USER_ID);

    expect(mockWriteProfile).not.toHaveBeenCalled();
    expect(updates).toHaveLength(3);
  });

  it("reassigns every owned table and clears the expiry", async () => {
    const updates = mockDb(CV_EXTRACTION);
    await claimAnonSession(USER_ID);

    expect(updates.map((u) => u.table)).toEqual([
      "analysis_jobs",
      "analyses",
      "optimized_resumes",
    ]);
    for (const update of updates) {
      expect(update.anonId).toBe(ANON_ID);
      expect(update.patch).toEqual({
        user_id: USER_ID,
        anon_id: null,
        expires_at: null,
      });
    }
  });

  it("clears both cookies once claimed", async () => {
    mockDb(CV_EXTRACTION);
    await claimAnonSession(USER_ID);
    expect(cookieJar.has(ANON_SESSION_COOKIE)).toBe(false);
    expect(cookieJar.has(ANON_USED_COOKIE)).toBe(false);
  });

  it("still reassigns the rows when there is no CV to import", async () => {
    const updates = mockDb(null);
    await claimAnonSession(USER_ID);
    expect(mockWriteProfile).not.toHaveBeenCalled();
    expect(updates).toHaveLength(3);
  });

  it("re-validates the stored CV instead of trusting it", async () => {
    const updates = mockDb({ skills: [{ evil: true }] });
    await claimAnonSession(USER_ID);
    expect(mockWriteProfile).not.toHaveBeenCalled();
    expect(updates).toHaveLength(3);
  });

  it("swallows errors rather than breaking sign-in", async () => {
    mockAdmin.mockImplementation(() => {
      throw new Error("database is down");
    });
    await expect(claimAnonSession(USER_ID)).resolves.toBe(false);
  });

  it("reports the claim so the caller can redirect to the analysis", async () => {
    mockDb(CV_EXTRACTION);
    await expect(claimAnonSession(USER_ID)).resolves.toBe(true);
  });

  it("reports no claim when the visitor has no anon session", async () => {
    cookieJar.delete(ANON_SESSION_COOKIE);
    await expect(claimAnonSession(USER_ID)).resolves.toBe(false);
  });
});
