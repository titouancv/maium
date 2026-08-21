import { describe, expect, it } from "vitest";
import { nearestSlot, type Slot } from "./useDragReorder";

/** Three 100px-wide cards in a row, centres at 50, 150 and 250. */
const row: Slot[] = [
  { cx: 50, cy: 50 },
  { cx: 150, cy: 50 },
  { cx: 250, cy: 50 },
];

describe("nearestSlot", () => {
  it("keeps the card in place until it passes the halfway point", () => {
    expect(nearestSlot(row, 0, 49, 0)).toBeNull();
    expect(nearestSlot(row, 0, 51, 0)).toBe(1);
  });

  it("skips straight to a far slot when the card is dragged that far", () => {
    expect(nearestSlot(row, 0, 200, 0)).toBe(2);
  });

  it("settles once the card sits on the slot it was moved to", () => {
    // Right after taking over slot 1, the card is offset by one slot from its
    // new home — it must not immediately claim another.
    expect(nearestSlot(row, 1, 0, 0)).toBeNull();
  });

  it("reads a grid on both axes, gaps included", () => {
    const grid: Slot[] = [
      { cx: 50, cy: 50 },
      { cx: 160, cy: 50 },
      { cx: 50, cy: 160 },
      { cx: 160, cy: 160 },
    ];
    // Dragged down into the gap between the two rows, still nearest its own.
    expect(nearestSlot(grid, 0, 0, 50)).toBeNull();
    expect(nearestSlot(grid, 0, 0, 60)).toBe(2);
    expect(nearestSlot(grid, 0, 110, 110)).toBe(3);
  });

  it("ignores slots it could not measure", () => {
    expect(nearestSlot([{ cx: 50, cy: 50 }, null], 0, 200, 0)).toBeNull();
    expect(nearestSlot([null, { cx: 150, cy: 50 }], 0, 200, 0)).toBeNull();
  });
});
