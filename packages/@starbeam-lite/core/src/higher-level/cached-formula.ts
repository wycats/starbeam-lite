import { now, TAG } from "@starbeam-lite/shared";

import { FormulaTag } from "../primitives/formula.js";
import * as runtime from "../primitives/runtime.js";
import type { Tag, Tagged, TagSnapshot } from "../primitives/tag.js";
import { lastUpdated } from "../primitives/tag.js";

export class CachedFormula<T> implements Tagged<T> {
  [TAG]: Tag;
  readonly #compute: () => T;
  readonly #last: {
    formula: FormulaTag;
  };
  [TAG]: Tag = new FormulaTag();

  read: () => T;
}

export class FinalizedFormula<T> {
  #lastValidated = now();
  #dependencies: TagSnapshot;

  constructor(dependencies: TagSnapshot) {
    this.#dependencies = dependencies;
  }

  isStale(): boolean {
    return (
      Math.max(...this.#dependencies.map(lastUpdated)) > this.#lastValidated
    );
  }

  update() {
    const done = runtime.start();

    return {
      done: () => {
        this.#dependencies = done();
        this.#lastValidated = now();
        return this;
      },
    };
  }
}

// export function FinalizedFormula(children: TagSnapshot): FinalizedFormula {
//   let lastValidated = NOW.now;

//   const isStale = () => lastUpdated(...children).at > lastValidated.at;

//   function update() {
//     const done = getRuntime().start();

//     return {
//       done: () => {
//         children = done();
//         lastValidated = NOW.now;
//         return formula;
//       },
//     } satisfies InitializingTrackingFrame;
//   }

//   const formula = {
//     isStale,
//     children: () => children,
//     update,
//   } satisfies FinalizedFormula;

//   return formula;
// }
