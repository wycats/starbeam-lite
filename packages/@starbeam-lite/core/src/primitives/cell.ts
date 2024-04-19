import { bump, consume, TAG } from "@starbeam-lite/shared";
import type { StorageTag as StorageTagFields } from "@starbeam-lite/shared/kernel";
import {
  FROZEN_STORAGE_TYPE,
  LAST_UPDATED_FIELD,
  MUTABLE_STORAGE_TYPE,
  TYPE_FIELD,
} from "@starbeam-lite/shared/kernel";

import { notify } from "./subscriptions.js";
import type { Tagged } from "./tag.js";

export function MutableTag(revision = bump()): StorageTagFields {
  return [MUTABLE_STORAGE_TYPE, revision, null];
}

export function mark(tag: StorageTagFields): void {
  if (import.meta.env.DEV && tag[TYPE_FIELD] === FROZEN_STORAGE_TYPE) {
    throw new Error("Attempted to update a frozen tag");
  }

  tag[LAST_UPDATED_FIELD] = bump();
  notify(tag);
}

export function freeze(tag: StorageTagFields): void {
  tag[TYPE_FIELD] = FROZEN_STORAGE_TYPE;
}

export type Equality<T> = (a: T, b: T) => boolean;

export class Cell<T> implements Tagged<T> {
  static create<T>(value: T, equals: Equality<T> = Object.is): Cell<T> {
    return new Cell(value, equals);
  }

  #value: T;
  readonly #equals: Equality<T>;
  readonly [TAG]: StorageTagFields;

  private constructor(value: T, equals: Equality<T>) {
    this.#value = value;
    this.#equals = equals;
    this[TAG] = MutableTag();
  }

  read(): T {
    consume(this[TAG]);

    return this.#value;
  }

  set(value: T): boolean {
    if (this.#equals(this.#value, value)) {
      return false;
    }

    this.#value = value;

    mark(this[TAG]);

    return true;
  }

  update(updater: (value: T) => T): void {
    this.set(updater(this.read()));
  }

  freeze(): void {
    freeze(this[TAG]);
  }
}

if (import.meta.vitest) {
  const { it, describe, expect } = import.meta.vitest;

  describe("Cell", () => {
    it("creates reactive storage", () => {
      const cell = Cell.create("hello");
      expect(cell.read()).toBe("hello");
    });

    it("updates when set", () => {
      const cell = Cell.create("hello");
      cell.set("world");
      expect(cell.read()).toBe("world");
    });

    it("updates when update() is called", () => {
      const cell = Cell.create("hello");
      cell.update((value) => value + " world");
      expect(cell.read()).toBe("hello world");
    });

    it("is frozen when freeze() is called", () => {
      const cell = Cell.create("hello");
      cell.freeze();
      expect(() => cell.set("world")).toThrow();
    });
  });
}
