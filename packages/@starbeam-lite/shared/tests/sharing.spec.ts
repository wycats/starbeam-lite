import { expect, it } from "vitest";
import type { SharedContext, Stack } from "@starbeam-lite/shared";
import * as kernel from "@starbeam-lite/shared/kernel";
import type { StorageTag } from "../src/kernel";

const INITIAL_TIMESTAMP = 1;
const TICK = 1;

interface Frame {
  parent: Frame | null;
  lastUpdated: number;
  tags: Set<StorageTag>;
}

// equivalent to a second impementation of the library
let current: Frame = {
  parent: null as Frame | null,
  lastUpdated: INITIAL_TIMESTAMP,
  tags: new Set<StorageTag>(),
};

const stack = [
  () => {
    const prev = current;
    current = {
      parent: prev,
      lastUpdated: -1,
      tags: new Set(),
    };
  },

  () => {
    const result = current;
    current = unwrap(result.parent);
    return [result.lastUpdated, result.tags];
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
    const { begin, commit, consume } = await import("@starbeam-lite/shared");
    const [beginOther, commitOther, consumeOther] = stack;
    {
      begin();
      const obj = mutable(1);
      consume(obj);
      const [lastUpdated, items] = commit();
      expect([...items]).toEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      const done = beginOther();
      const obj = mutable(1);
      consume(obj);
      const [lastUpdated, items] = commitOther();
      expect([...items]).toEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      begin();
      const obj = mutable(1);
      consumeOther(obj);
      const [lastUpdated, items] = commit();
      expect([...items]).toEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      begin();
      const obj = mutable(1);
      consume(obj);
      consumeOther(obj);
      const [lastUpdated, items] = commit();
      expect([...items]).toStrictEqual([obj]);
      expect(lastUpdated).toBe(1);
    }

    {
      begin();
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
    }
  }
);

function mutable(updated: number): StorageTag {
  return [kernel.MUTABLE_STORAGE_TYPE, updated, null];
}

export function unwrap<T>(value: T | undefined | null): T {
  if ((import.meta.env.DEV && value === undefined) || value === null) {
    throw new Error("Attempted to unwrap a null or undefined value");
  }

  return value as T;
}
