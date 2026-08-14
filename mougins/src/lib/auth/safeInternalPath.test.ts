import { describe, it, expect } from "vitest";
import { safeInternalPath } from "./safeInternalPath";

const ORIGIN = "https://maium.app";

describe("safeInternalPath", () => {
  it("keeps an internal analysis path", () => {
    expect(safeInternalPath("/jobs/abc-123", ORIGIN)).toBe("/jobs/abc-123");
  });

  it("keeps the query string of an internal path", () => {
    expect(safeInternalPath("/jobs/abc?tab=prep", ORIGIN)).toBe(
      "/jobs/abc?tab=prep",
    );
  });

  it("rejects a protocol-relative URL", () => {
    expect(safeInternalPath("//evil.com", ORIGIN)).toBeNull();
  });

  it("rejects an absolute URL to another origin", () => {
    expect(safeInternalPath("https://evil.com/jobs", ORIGIN)).toBeNull();
  });

  it("rejects a backslash-smuggled host", () => {
    expect(safeInternalPath("/\\evil.com", ORIGIN)).toBeNull();
  });

  it("rejects a missing or relative path", () => {
    expect(safeInternalPath(null, ORIGIN)).toBeNull();
    expect(safeInternalPath("jobs/abc", ORIGIN)).toBeNull();
  });
});
