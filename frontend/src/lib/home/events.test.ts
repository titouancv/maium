import { describe, it, expect } from "vitest";
import { getTodayEvent } from "./events";

describe("getTodayEvent", () => {
  it("returns the recurring holiday for a matching month/day", () => {
    // Christmas of an arbitrary year.
    expect(getTodayEvent(new Date(2030, 11, 25))).toEqual({ key: "christmas" });
  });

  it("returns null on an ordinary day", () => {
    expect(getTodayEvent(new Date(2030, 2, 3))).toBeNull();
  });

  it("prefers a specific dated event over a recurring one", () => {
    // 2026-06-11 is a dated event; no recurring event shares that day.
    expect(getTodayEvent(new Date(2026, 5, 11))).toEqual({
      key: "worldCupOpening",
    });
  });

  it("matches recurring events regardless of year", () => {
    expect(getTodayEvent(new Date(1999, 0, 1))).toEqual({ key: "newYear" });
    expect(getTodayEvent(new Date(2045, 0, 1))).toEqual({ key: "newYear" });
  });
});
