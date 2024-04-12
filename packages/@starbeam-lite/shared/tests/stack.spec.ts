import { consume, start } from "@starbeam-lite/shared";
import { describe, expect, test } from "vitest";
import { MUTABLE_STORAGE_TYPE, type StorageTag } from "../src/kernel";

describe("the autotracking stack", () => {
  test("consuming a lifetime", () => {
    const done = start();
    const obj = mutable(1);
    consume(obj);
    const [lastUpdated, items] = done();
    expect([...items]).toEqual([obj]);
    expect(lastUpdated).toBe(1);
  });

  test("consuming the same lifetime twice", () => {
    const done = start();
    const obj = mutable(1);
    consume(obj);
    consume(obj);
    const [lastUpdated, items] = done();
    expect([...items]).toStrictEqual([obj]);
    expect(lastUpdated).toBe(1);
  });

  test("consuming multiple lifetimes, multiple times", () => {
    const done = start();
    const obj1 = mutable(1);
    const obj2 = mutable(2);
    const obj3 = mutable(1);

    consume(obj1);
    consume(obj2);
    consume(obj1);
    consume(obj2);
    consume(obj2);
    consume(obj1);
    consume(obj3);

    const [lastUpdated, items] = done();
    expect([...items]).toStrictEqual([obj1, obj2, obj3]);
    expect(lastUpdated).toBe(2);
  });
});

function mutable(updated: number): StorageTag {
  return [MUTABLE_STORAGE_TYPE, updated, null];
}
