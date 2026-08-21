import { describe, expect, it } from "vitest";
import { itemKey, moveItem } from "./utils";

describe("moveItem", () => {
  it("inserts at the target index rather than swapping", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns the same array when nothing moves", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 1, 1)).toBe(items);
  });

  it("leaves the source array untouched", () => {
    const items = ["a", "b", "c"];
    moveItem(items, 0, 2);
    expect(items).toEqual(["a", "b", "c"]);
  });
});

describe("itemKey", () => {
  it("is stable per object and unique across objects", () => {
    const a = { title: "a" };
    const b = { title: "a" };
    expect(itemKey(a)).toBe(itemKey(a));
    expect(itemKey(a)).not.toBe(itemKey(b));
  });
});
