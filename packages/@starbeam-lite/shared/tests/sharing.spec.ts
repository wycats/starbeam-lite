import { expect, it } from "vitest";
import type { SharedContext, Stack } from "@starbeam-lite/shared";

const INITIAL_TIMESTAMP = 1;
const TICK = 1;

// equivalent to a second impementation of the library
let current = new Set<object>();

const stack = [
  <const T extends object>() => {
    const prev = current;
    current = new Set();

    return () => {
      const result = current;
      current = prev;
      return result as unknown as ReadonlySet<T>;
    };
  },

  (tag: object) => {
    current.add(tag);
  },
] satisfies Stack;

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

    shared.now += 1;

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
      const obj = {};
      consume(obj);
      const items = done();
      expect([...items]).toEqual([obj]);
    }

    {
      const done = startOther();
      const obj = {};
      consume(obj);
      const items = done();
      expect([...items]).toEqual([obj]);
    }

    {
      const done = start();
      const obj = {};
      consumeOther(obj);
      const items = done();
      expect([...items]).toEqual([obj]);
    }

    {
      const done = start();
      const obj = {};
      consume(obj);
      consumeOther(obj);
      const items = done();
      expect([...items]).toStrictEqual([obj]);
    }

    {
      const done = start();
      const obj1 = {};
      const obj2 = {};
      const obj3 = {};

      consume(obj1);
      consume(obj2);
      consume(obj1);
      consume(obj2);
      consume(obj2);
      consume(obj1);
      consume(obj3);

      const items = done();
      expect([...items]).toStrictEqual([obj1, obj2, obj3]);
    }
  }
);
