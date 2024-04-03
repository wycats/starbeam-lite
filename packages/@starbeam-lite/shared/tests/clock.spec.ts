import { now, bump } from "@starbeam-lite/shared";
import { expect, it } from "vitest";

const INITIAL_TIMESTAMP = 1;

it("starts at 1, and increments on bumpT", () => {
  expect(now()).toBe(INITIAL_TIMESTAMP);
  expect(bump()).toBe(INITIAL_TIMESTAMP + 1);
  expect(now()).toBe(INITIAL_TIMESTAMP + 1);
});
