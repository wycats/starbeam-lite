import type { FormulaTag as FormulaTagFields } from "@starbeam-lite/shared/kernel";
import {
  DEPENDENCIES_FIELD,
  INITIALIZED_FORMULA_TYPE,
  LAST_UPDATED_FIELD,
  SUBSCRIPTIONS_FIELD,
  TYPE_FIELD,
  UNINITIALIZED_FORMULA_TYPE,
} from "@starbeam-lite/shared/kernel";

import { updated as updatedSubscription } from "./subscriptions.js";
import type { TagSnapshot } from "./tag.js";

export function updated(
  tag: FormulaTagFields,
  tags: TagSnapshot,
  lastUpdated: number
): void {
  tag[DEPENDENCIES_FIELD] = tags;
  tag[LAST_UPDATED_FIELD] = lastUpdated;
  updatedSubscription(tag, tags);

  if (tag[TYPE_FIELD] === UNINITIALIZED_FORMULA_TYPE) {
    tag[TYPE_FIELD] = INITIALIZED_FORMULA_TYPE;
    tag[SUBSCRIPTIONS_FIELD]?.notify();
  }
}
