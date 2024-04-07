import { now, TAG } from "@starbeam-lite/shared";

import { FormulaTag } from "../primitives/formula.js";
import * as runtime from "../primitives/runtime.js";
import type { Tagged, TagSnapshot } from "../primitives/tag.js";
import { lastUpdated } from "../primitives/tag.js";

export class CachedFormula<T> implements Tagged<T> {
  static create<T>(compute: () => T): CachedFormula<T> {
    return new CachedFormula(compute);
  }

  readonly #compute: () => T;
  #last: {
    children: TagSnapshot;
    validated: number;
    value: T;
  } | null = null;

  readonly [TAG]: FormulaTag = new FormulaTag();

  private constructor(compute: () => T) {
    this.#compute = compute;
  }

  readonly read = (): T => {
    const value = this.#evaluate();
    runtime.consume(this[TAG]);
    return value;
  };

  #evaluate() {
    const tag = this[TAG];

    if (this.#last === null) {
      const done = runtime.start();
      const value = this.#compute();
      const children = [...done()];

      this.#last = { children, validated: now(), value };
      tag.updated(children);
    } else if (isStale(this.#last)) {
      const done = runtime.start();

      this.#last = {
        value: this.#compute(),
        children: [...done()],
        validated: now(),
      };
      tag.updated(this.#last.children);
    }

    runtime.consume(tag);
    return this.#last.value;
  }
}

function isStale({
  children,
  validated,
}: {
  children: TagSnapshot;
  validated: number;
}) {
  return Math.max(...children.map(lastUpdated)) > validated;
}
