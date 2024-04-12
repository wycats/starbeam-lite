/* eslint-disable @typescript-eslint/no-explicit-any */
import { CachedFormula, Cell } from "@starbeam-lite/core";
import { FormulaTag, subscribe, updated } from "@starbeam-lite/core/subtle";
import { TAG } from "@starbeam-lite/shared";
import type {
  FormulaTag as FormulaTagFields,
  StorageTag as StorageTagFields,
} from "@starbeam-lite/shared/kernel";

const CELL_MAP = new WeakMap<StorageTagFields, State<any>>();

class State<in out T> {
  readonly #cell: Cell<T>;

  constructor(
    value: T,
    { equals = Object.is }: { equals?: (a: T, b: T) => boolean } = {}
  ) {
    this.#cell = Cell.create(value, (a, b) => equals.call(this, a, b));
    CELL_MAP.set(this.#cell[TAG], this);
  }

  get [TAG](): StorageTagFields {
    return this.#cell[TAG];
  }

  get(): T {
    return this.#cell.read();
  }

  set(value: T): void {
    this.#cell.set(value);
  }
}

const FORMULA_MAP = new WeakMap<Computed<unknown>, FormulaTagFields>();

class Computed<out T> {
  readonly #formula: CachedFormula<T>;
  #last: { value: T } | null = null;

  constructor(compute: () => T) {
    this.#formula = CachedFormula(() => compute.call(this));
    FORMULA_MAP.set(this, this.#formula[TAG]);
  }

  get [TAG](): FormulaTagFields {
    return this.#formula[TAG];
  }

  get(): T {
    const next = this.#formula.read();

    if (this.#last) {
      const prev = this.#last.value;
      if (Object.is(prev, next)) {
        return prev;
      } else {
        return (this.#last.value = next);
      }
    } else {
      this.#last = { value: next };
      return next;
    }
  }
}

class Watcher {
  readonly #callback: () => void;
  readonly #unwatch = new WeakMap<State<any> | Computed<any>, () => void>();

  constructor(callback: () => void) {
    this.#callback = callback;
  }

  watch<T>(signal: State<T> | Computed<T>): void {
    if (signal instanceof Computed) {
      this.#unwatch.set(signal, subscribe(signal[TAG], this.#callback));
    } else {
      const tag = FormulaTag();
      updated([signal[TAG]], signal[TAG].lastUpdated);
      this.#unwatch.set(signal, subscribe(tag, this.#callback));
    }
  }

  unwatch<T>(signal: State<T> | Computed<T>): void {
    this.#unwatch.get(signal)?.();
    this.#unwatch.delete(signal);
  }
}

export const Signal = {
  State,

  Computed,

  subtle: {
    Watcher,
    watched: Symbol("Signal.subtle.watched"),
    unwatched: Symbol("Signal.subtle.unwatched"),

    introspectSources(computed: Computed<unknown>): State<any>[] {
      const formula = FORMULA_MAP.get(computed);

      if (formula) {
        return formula.dependencies
          .map((tag) => CELL_MAP.get(tag))
          .filter(PRESENT);
      } else {
        return [];
      }
    },
  },
};

const PRESENT = Boolean as unknown as <T>(value: T | undefined) => value is T;
