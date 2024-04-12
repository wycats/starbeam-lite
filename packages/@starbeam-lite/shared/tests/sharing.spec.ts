import { expect, it } from "vitest";
import type { SharedContext, Stack } from "@starbeam-lite/shared";
import * as kernel from "@starbeam-lite/shared/kernel";
import type { StorageTag } from "../src/kernel";

const INITIAL_TIMESTAMP = 1;
const TICK = 1;

// equivalent to a second impementation of the library
let current = {
  lastUpdated: INITIAL_TIMESTAMP,
  tags: new Set<StorageTag>(),
};

const stack = [
  () => {
    const prev = current;
    current = {
      lastUpdated: -1,
      tags: new Set(),
    };

    return () => {
      const result = current;
      current = prev;
      return [result.lastUpdated, result.tags];
    };
  },

  (tag: StorageTag) => {
    current.tags.add(tag);
    current.lastUpdated = Math.max(
      current.lastUpdated,
      tag[kernel.LAST_UPDATED_FIELD]
    );
  },
] as Stack;

it.sequential(
  "clock: works even if the coordination is already set",
  async () => {
    const shared = {
      now: INITIAL_TIMESTAMP,
      stack,
    } satisfies SharedContext;
    (globalThis as Record<symbol, unknown>)[
      Symbol.for("starbeam.COORDINATION")
    ] = shared;

    const { now, bump } = await import("@starbeam-lite/shared");

    expect(now()).toBe(INITIAL_TIMESTAMP);

    shared.now += TICK;

    expect(now()).toBe(INITIAL_TIMESTAMP + TICK);

    expect(bump()).toBe(INITIAL_TIMESTAMP + TICK + TICK);
    expect(shared.now).toBe(INITIAL_TIMESTAMP + TICK + TICK);
  }
);

it.sequential(
  "stack: works even if the coordination is already set",
  async () => {
    const { start, consume } = await import("@starbeam-lite/shared");
    const [startOther, consumeOther] = stack;
    {
      const done = start();
      const obj = mutable(1);
      consume(obj);
      const [lastUpdated, items] = done();
      expect([...items]).toEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      const done = startOther();
      const obj = mutable(1);
      consume(obj);
      const [lastUpdated, items] = done();
      expect([...items]).toEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      const done = start();
      const obj = mutable(1);
      consumeOther(obj);
      const [lastUpdated, items] = done();
      expect([...items]).toEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      const done = start();
      const obj = mutable(1);
      consume(obj);
      consumeOther(obj);
      const [lastUpdated, items] = done();
      expect([...items]).toStrictEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
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
    }
  }
);

function mutable(updated: number): StorageTag {
  return [kernel.MUTABLE_STORAGE_TYPE, updated, null];
}
