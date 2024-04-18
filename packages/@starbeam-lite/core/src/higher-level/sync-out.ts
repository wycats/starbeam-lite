import { begin, commit, TAG } from "@starbeam-lite/shared";
import type { FormulaTag as FormulaTagFields } from "@starbeam-lite/shared/kernel";
import {
  DEPENDENCIES_FIELD,
  LAST_UPDATED_FIELD,
} from "@starbeam-lite/shared/kernel";

import { FormulaTag, updated } from "../primitives/formula.js";

export interface SyncOut {
  [TAG]: FormulaTagFields;
  poll: () => void;
}

export function SyncOut(flush: () => void): SyncOut {
  let lastValidated = -1;
  const tag = FormulaTag();

  return {
    [TAG]: tag,
    poll: () => {
      if (
        tag[DEPENDENCIES_FIELD].reduce((a, b) => a + b[LAST_UPDATED_FIELD], 0) >
        lastValidated
      ) {
        begin();
        flush();
        const [lastUpdated, tags] = commit();
        lastValidated = lastUpdated;
        updated(tag, [...tags], lastUpdated);
      }
    },
  };
}
