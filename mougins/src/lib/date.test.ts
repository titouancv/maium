import { describe, it, expect } from "vitest";
import { parsePartialDateToTimestamp } from "./date";

describe("parsePartialDateToTimestamp", () => {
  it("parses YYYY-MM to the UTC first of the month", () => {
    expect(parsePartialDateToTimestamp("2023-06")).toBe(Date.UTC(2023, 5, 1));
  });

  it("parses a bare YYYY to January 1st", () => {
    expect(parsePartialDateToTimestamp("2019")).toBe(Date.UTC(2019, 0, 1));
  });

  it("trims surrounding whitespace", () => {
    expect(parsePartialDateToTimestamp("  2021-02 ")).toBe(Date.UTC(2021, 1, 1));
  });

  it("rejects malformed input", () => {
    for (const value of [
      "",
      "present",
      "06-2023",
      "2023/06",
      "2023-6",
      "2023-06-15",
      "not a date",
    ]) {
      expect(parsePartialDateToTimestamp(value)).toBeNull();
    }
  });

  it("rejects out-of-range months", () => {
    expect(parsePartialDateToTimestamp("2023-00")).toBeNull();
    expect(parsePartialDateToTimestamp("2023-13")).toBeNull();
  });

  it("rejects years outside a plausible career range", () => {
    expect(parsePartialDateToTimestamp("1899-01")).toBeNull();
    const farFuture = new Date().getUTCFullYear() + 11;
    expect(parsePartialDateToTimestamp(`${farFuture}-01`)).toBeNull();
  });
});
