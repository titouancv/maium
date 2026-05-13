import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { POST } from "./route";
import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

const validBody = {
  email: "test@example.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
  pseudo: "johndoe",
  dob: "1990-01-01",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeMockSupabase({
  signUpResult,
  insertResult,
}: {
  signUpResult: { data: { user: { id: string } | null }; error: null | { message: string } };
  insertResult?: { data: { id: string } | null; error: null | { code: string; message: string } };
}) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue(signUpResult),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(insertResult ?? { data: null, error: null }),
        }),
      }),
    }),
  };
}

describe("POST /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 with the new user id on success", async () => {
    const userId = "abc-123";
    mockCreateClient.mockResolvedValue(
      makeMockSupabase({
        signUpResult: { data: { user: { id: userId } }, error: null },
        insertResult: { data: { id: userId }, error: null },
      }) as never
    );

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe(userId);
  });

  it("returns 400 when the request body is invalid", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 when the email is already registered (auth error)", async () => {
    mockCreateClient.mockResolvedValue(
      makeMockSupabase({
        signUpResult: {
          data: { user: null },
          error: { message: "User already registered" },
        },
      }) as never
    );

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });

  it("returns 409 when the email is already in use (db unique constraint)", async () => {
    const userId = "abc-123";
    mockCreateClient.mockResolvedValue(
      makeMockSupabase({
        signUpResult: { data: { user: { id: userId } }, error: null },
        insertResult: { data: null, error: { code: "23505", message: "unique violation" } },
      }) as never
    );

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
  });
});
