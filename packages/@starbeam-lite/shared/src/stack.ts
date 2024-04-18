import { buildSharedContext } from "./coordination.js";
import type { StorageTag } from "./kernel.js";
import { LAST_UPDATED_FIELD } from "./kernel.js";

export type Stack = [
  begin: () => void,
  commit: () => [lastUpdated: number, dependencies: ReadonlySet<StorageTag>],
  consume: (tag: StorageTag) => void,
];

const context = buildSharedContext();

const NO_TAGS = -1;

class TrackingFrame {
  readonly #parent: TrackingFrame | null;
  readonly #tags = new Set<StorageTag>();
  #lastUpdated = NO_TAGS;

  constructor(parent: TrackingFrame | null = null) {
    this.#parent = parent;
  }

  add(tag: StorageTag) {
    this.#lastUpdated = Math.max(this.#lastUpdated, tag[LAST_UPDATED_FIELD]);
    this.#tags.add(tag);
  }

  done(): [
    parent: TrackingFrame | null,
    lastUpdated: number,
    dependencies: ReadonlySet<StorageTag>,
  ] {
    return [this.#parent, this.#lastUpdated, this.#tags];
  }
}

const [begin, commit, consume] = (context.stack ??= (() => {
  let current = null as TrackingFrame | null;

  return [
    () => {
      const prev = current;
      current = new TrackingFrame(prev);
    },

    () => {
      const [parent, lastUpdated, tags] = unwrap(current).done();
      current = parent;
      return [lastUpdated, tags];
    },

    (tag: StorageTag) => {
      current?.add(tag);
    },
  ] as Stack;
})());

export { begin, commit, consume };

export function unwrap<T>(value: T | undefined | null): T {
  if ((import.meta.env.DEV && value === undefined) || value === null) {
    throw new Error("Attempted to unwrap a null or undefined value");
  }

  return value as T;
}
