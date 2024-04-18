import { consume, begin, commit } from "@starbeam-lite/shared";
import { describe, expect, test } from "vitest";
import { MUTABLE_STORAGE_TYPE, type StorageTag } from "../src/kernel";

describe("the autotracking stack", () => {
  test("consuming a lifetime", () => {
    begin();
    const obj = mutable(1);
    consume(obj);
    const [lastUpdated, items] = commit();
    expect([...items]).toEqual([obj]);
    expect(lastUpdated).toBe(1);
  });

  test("consuming the same lifetime twice", () => {
    begin();
    const obj = mutable(1);
    consume(obj);
    consume(obj);
    const [lastUpdated, items] = commit();
    expect([...items]).toStrictEqual([obj]);
    expect(lastUpdated).toBe(1);
  });

  test("consuming multiple lifetimes, multiple times", () => {
    const done = begin();
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

    const [lastUpdated, items] = commit();
    expect([...items]).toStrictEqual([obj1, obj2, obj3]);
    expect(lastUpdated).toBe(2);
  });
});

function mutable(updated: number): StorageTag {
  return [MUTABLE_STORAGE_TYPE, updated, null];
}
