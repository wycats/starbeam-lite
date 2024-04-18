import { begin, commit, consume, TAG } from "@starbeam-lite/shared";
import type { FormulaTag as FormulaTagFields } from "@starbeam-lite/shared/kernel";
import {
  DEPENDENCIES_FIELD,
  INITIALIZED_FORMULA_TYPE,
  LAST_UPDATED_FIELD,
  TYPE_FIELD,
  UNINITIALIZED_FORMULA_TYPE,
} from "@starbeam-lite/shared/kernel";

import * as runtime from "./runtime.js";
import type { Tagged, TagSnapshot } from "./tag.js";

const INITIAL_REVISION = 0;
const EMPTY_TAGS: TagSnapshot = [];

export function FormulaTag(): FormulaTagFields {
  return [UNINITIALIZED_FORMULA_TYPE, INITIAL_REVISION, null, EMPTY_TAGS];
}

export function updated(
  tag: FormulaTagFields,
  tags: TagSnapshot,
  lastUpdated: number
): void {
  tag[DEPENDENCIES_FIELD] = tags;
  tag[LAST_UPDATED_FIELD] = lastUpdated;
  runtime.updated(tag, tags);

  if (tag[TYPE_FIELD] === UNINITIALIZED_FORMULA_TYPE) {
    tag[TYPE_FIELD] = INITIALIZED_FORMULA_TYPE;

    for (const newTag of tags) {
      runtime.notify(newTag);
    }
  }
}

/**
 * A formula tag represents the validation state of a formula.
 */
export class Formula<T> implements Tagged<T> {
  static create<T>(compute: () => T): Formula<T> {
    return new Formula(compute);
  }

  [TAG]: FormulaTagFields = FormulaTag();
  readonly #compute: () => T;

  private constructor(compute: () => T) {
    this.#compute = compute;
  }

  read(): T {
    return evaluate(this.#compute, this[TAG]);
  }
}

function evaluate<T>(compute: () => T, tag: FormulaTagFields): T {
  begin();
  const value = compute();
  const [lastUpdated, tags] = commit();

  runtime.updated(tag, [...tags]);
  tag[LAST_UPDATED_FIELD] = lastUpdated;

  for (const tag of tags) {
    consume(tag);
  }

  return value;
}
