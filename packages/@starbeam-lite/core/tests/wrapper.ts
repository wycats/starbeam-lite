import { CachedFormula, Cell, Formula } from "@starbeam-lite/core";
import { FormulaTag, MutableTag, subscribe } from "@starbeam-lite/core/subtle";
import { TAG } from "@starbeam-lite/shared";
import { untrack } from "@starbeam-lite/core/fishy";

const CELL_MAP = new WeakMap<MutableTag, State<any>>();

class State<in out T> {
  #cell: Cell<T>;

  constructor(
    value: T,
    { equals = Object.is }: { equals?: (a: T, b: T) => boolean } = {}
  ) {
    this.#cell = Cell.create(value, (a, b) => equals.call(this, a, b));
    CELL_MAP.set(this.#cell[TAG], this);
  }

  get [TAG]() {
    return this.#cell[TAG];
  }

  get(): T {
    return this.#cell.read();
  }

  set(value: T) {
    this.#cell.set(value);
  }
}

const FORMULA_MAP = new WeakMap<Computed<unknown>, FormulaTag>();

class Computed<out T> {
  #formula: CachedFormula<T>;
  #last: { value: T } | null = null;

  constructor(compute: () => T) {
    this.#formula = CachedFormula.create(() => compute.call(this));
    FORMULA_MAP.set(this, this.#formula[TAG]);
  }

  get [TAG]() {
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
  #callback: () => void;
  #unwatch = new WeakMap<State<any> | Computed<any>, () => void>();

  constructor(callback: () => void) {
    this.#callback = callback;
  }

  watch<T>(signal: State<T> | Computed<T>) {
    if (signal instanceof Computed) {
      this.#unwatch.set(signal, subscribe(signal[TAG], this.#callback));
    } else {
      const tag = new FormulaTag();
      tag.updated([signal[TAG]]);
      this.#unwatch.set(signal, subscribe(tag, this.#callback));
    }
  }

  unwatch<T>(signal: State<T> | Computed<T>) {
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

    introspectSources(computed: Computed<unknown>) {
      const formula = FORMULA_MAP.get(computed);

      if (formula) {
        return formula.dependencies.map((tag) => CELL_MAP.get(tag));
      } else {
        return [];
      }
    },

    untrack,
  },
};
