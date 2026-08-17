import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createUnsubscribeToken,
  createUnsubscribeUrl,
  readUnsubscribeToken,
} from "./unsubscribeToken";

const USER_ID = "6f1b7c22-9c4d-4a0e-9d1a-2b3c4d5e6f70";

describe("unsubscribe token", () => {
  beforeEach(() => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET;
  });

  it("round-trips the user id", () => {
    const token = createUnsubscribeToken(USER_ID);
    expect(token).not.toBeNull();
    expect(readUnsubscribeToken(token!)).toBe(USER_ID);
  });

  it("rejects a tampered signature", () => {
    const [payload] = createUnsubscribeToken(USER_ID)!.split(".");
    expect(readUnsubscribeToken(`${payload}.forged`)).toBeNull();
  });

  it("rejects a token whose payload was swapped for another user", () => {
    const signature = createUnsubscribeToken(USER_ID)!.split(".")[1];
    const otherId = Buffer.from("someone-else", "utf8").toString("base64url");
    expect(readUnsubscribeToken(`${otherId}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createUnsubscribeToken(USER_ID)!;
    process.env.EMAIL_UNSUBSCRIBE_SECRET = "another-secret";
    expect(readUnsubscribeToken(token)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(readUnsubscribeToken("")).toBeNull();
    expect(readUnsubscribeToken("no-separator")).toBeNull();
  });

  it("produces no token and reads none without a secret", () => {
    const token = createUnsubscribeToken(USER_ID)!;
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET;

    expect(createUnsubscribeToken(USER_ID)).toBeNull();
    expect(createUnsubscribeUrl(USER_ID)).toBeNull();
    expect(readUnsubscribeToken(token)).toBeNull();
  });

  it("builds an absolute url carrying the token", () => {
    const url = new URL(createUnsubscribeUrl(USER_ID)!);

    expect(url.pathname).toBe("/api/email/unsubscribe");
    expect(readUnsubscribeToken(url.searchParams.get("token")!)).toBe(USER_ID);
  });
});
