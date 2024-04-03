import { buildSharedContext } from "./coordination.js";

export type Stack = [
  start: <const T extends object>() => () => ReadonlySet<T>,
  consume: <const T extends object>(tag: T) => void,
];

const context = buildSharedContext();

const [start, consume] = (context.stack ??= (() => {
  let current = new Set<object>();

  return [
    <const T extends object>() => {
      const prev = current;
      current = new Set<T>();

      return () => {
        const result = current;
        current = prev;
        return result as T;
      };
    },

    (tag: object) => {
      current.add(tag);
    },
  ] satisfies Stack;
})());

export { consume, start };
