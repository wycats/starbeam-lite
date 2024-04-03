import type { Stack } from "./stack.js";

export interface SharedContext {
  now: number;
  readonly stack: Stack;
}

export type Builder<T> = { -readonly [P in keyof T]?: T[P] };

export const COORDINATION: unique symbol = Symbol.for("starbeam.COORDINATION");
export type COORDINATION = typeof COORDINATION;

export const buildSharedContext = (): Builder<SharedContext> => {
  const global = globalThis as unknown as Partial<{
    [COORDINATION]: SharedContext;
  }>;

  let coordination = global[COORDINATION];

  if (!coordination) {
    global[COORDINATION] = coordination = {} as SharedContext;
  }

  return coordination;
};

export const getSharedContext = (): SharedContext =>
  buildSharedContext() as SharedContext;
