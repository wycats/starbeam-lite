import { Cell } from "@starbeam-lite/core";
import { describe, expect, it } from "vitest";

const INITIAL_TIMESTAMP = 1;
const INITIAL_VALUE = 0;
const UPDATE_VALUE = 10;

describe("Cell", () => {
  describe("equivalent to Signal.State (ported tests)", () => {
    it("should work", () => {
      const cell = Cell.create(INITIAL_VALUE);
      expect(cell.read()).toBe(INITIAL_VALUE);

      cell.set(UPDATE_VALUE);

      expect(cell.read()).toBe(UPDATE_VALUE);
    });
  });
});
