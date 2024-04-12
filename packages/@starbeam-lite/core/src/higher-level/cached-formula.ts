import { now, start, TAG } from "@starbeam-lite/shared";
import type { FormulaTag as FormulaTagFields } from "@starbeam-lite/shared/kernel";
import { LAST_UPDATED_FIELD } from "@starbeam-lite/shared/kernel";

import { FormulaTag, updated } from "../primitives/formula.js";
import type { Tagged } from "../primitives/tag.js";

const LAST_VALIDATED = 0;
const LAST_VALUE = 1;

export type CachedFormula<T> = Tagged<T> & { [TAG]: FormulaTagFields };

export function CachedFormula<T>(compute: () => T): CachedFormula<T> {
  const tag = FormulaTag();

  let last: [lastValidated: number, lastValue: T] | null = null;

  return {
    [TAG]: tag,
    read: () => {
      if (last === null || tag[LAST_UPDATED_FIELD] > last[LAST_VALIDATED]) {
        const done = start();
        const value = compute();
        const [lastUpdated, tags] = done();
        updated(tag, [...tags], lastUpdated);

        last = [now(), value];
        return value;
      } else {
        return last[LAST_VALUE];
      }
    },
  };
}
