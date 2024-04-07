import { Cell, Formula } from "@starbeam-lite/core";
import { describe, expect, it } from "vitest";

const INITIAL_TIMESTAMP = 1;
const INITIAL_VALUE = 0;
const MULTIPLIER = 2;
const UPDATE_VALUE = 10;

describe("Formula", () => {
  describe("equivalent to Signal.Computed (ported tests)", () => {
    it("should work", () => {
      const cell = Cell.create(INITIAL_VALUE);
      const formula = Formula.create(() => cell.read() * MULTIPLIER);

      expect(formula.read()).toBe(INITIAL_VALUE * MULTIPLIER);

      cell.set(UPDATE_VALUE);

      expect(cell.read()).toBe(UPDATE_VALUE);
      expect(formula.read()).toBe(UPDATE_VALUE * MULTIPLIER);
    });
  });
});
