import type { TAG } from "@starbeam-lite/shared";

import type { DependencyTag, MutableTag } from "./cell.js";
import type { FormulaTag } from "./formula.js";

export type Tag = MutableTag | FormulaTag;
export type TagSnapshot<T extends Tag | DependencyTag = Tag> = readonly T[];

export interface Tagged<T> {
  readonly [TAG]: Tag;
  read: () => T;
}

export function lastUpdated(tag: Tag): number {
  switch (tag.type) {
    case "formula":
      return Math.max(...tag.dependencies.map((tag) => tag.lastUpdated));
    case "mutable":
      return tag.lastUpdated;
  }
}
