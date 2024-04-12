import { buildSharedContext } from "./coordination.js";
import type { StorageTag } from "./kernel.js";
import { LAST_UPDATED_FIELD } from "./kernel.js";

export type Stack = [
  start: () => () => [
    lastUpdated: number,
    dependencies: ReadonlySet<StorageTag>,
  ],
  consume: (tag: StorageTag) => void,
];

const context = buildSharedContext();

const NO_TAGS = -1;

class TrackingFrame {
  readonly #tags = new Set<StorageTag>();
  #lastUpdated = NO_TAGS;

  add(tag: StorageTag) {
    this.#lastUpdated = Math.max(this.#lastUpdated, tag[LAST_UPDATED_FIELD]);
    this.#tags.add(tag);
  }

  done(): [lastUpdated: number, dependencies: ReadonlySet<StorageTag>] {
    return [this.#lastUpdated, this.#tags];
  }
}

const [start, consume] = (context.stack ??= (() => {
  let current = new TrackingFrame();

  return [
    () => {
      const prev = current;
      current = new TrackingFrame();

      return () => {
        const result = current;
        current = prev;
        return result.done();
      };
    },

    (tag: StorageTag) => {
      current.add(tag);
    },
  ] as Stack;
})());

export { consume, start };
