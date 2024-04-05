import { bump, consume, TAG } from "@starbeam-lite/shared";

import { isFishyUntracked } from "../fishy.js";
import { notify } from "./runtime.js";
import type { Subscription } from "./subscriptions.js";
import type { Tagged } from "./tag.js";

export class MutableTag {
  static create(revision: number = bump()): MutableTag {
    return new MutableTag(revision);
  }

  readonly type = "mutable";
  #lastUpdated: number;
  subscriptions: Set<Subscription> | undefined;
  #frozen = false;

  private constructor(revision: number) {
    this.#lastUpdated = revision;
  }

  get dependency(): MutableTag | null {
    return this.#frozen ? null : this;
  }

  get lastUpdated(): number {
    return this.#lastUpdated;
  }

  get isFrozen(): boolean {
    return this.#frozen;
  }

  consume(): void {
    if (!isFishyUntracked()) {
      consume(this);
    }
  }

  mark(): void {
    if (import.meta.env.DEV && this.#frozen) {
      throw new Error("Attempted to update a freezable tag, but it was frozen");
    }

    if (!isFishyUntracked()) {
      this.#lastUpdated = bump();
      notify(this);
    }
  }

  freeze(): void {
    this.#frozen = true;
  }
}

export type Equality<T> = (a: T, b: T) => boolean;

export class Cell<T> implements Tagged<T> {
  static create<T>(value: T, equals: Equality<T> = Object.is): Cell<T> {
    return new Cell(value, equals);
  }

  #value: T;
  readonly #equals: Equality<T>;
  readonly [TAG]: MutableTag;

  constructor(value: T, equals: Equality<T> = Object.is) {
    this.#value = value;
    this.#equals = equals;
    this[TAG] = MutableTag.create();
  }

  read(): T {
    this[TAG].consume();

    return this.#value;
  }

  set(value: T): boolean {
    if (this.#equals(this.#value, value)) {
      return false;
    }

    this.#value = value;

    this[TAG].mark();

    return true;
  }

  update(updater: (value: T) => T): void {
    this.set(updater(this.read()));
  }

  freeze(): void {
    this[TAG].freeze();
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
