import type { TAG } from "@starbeam-lite/shared";
import type { FormulaTag, StorageTag } from "@starbeam-lite/shared/kernel";
import { LAST_UPDATED_FIELD } from "@starbeam-lite/shared/kernel";

export type TagFields = StorageTag | FormulaTag;
export type TagSnapshot = readonly StorageTag[];

export interface Tagged<T> {
  readonly [TAG]: TagFields;
  read: () => T;
}

export function lastUpdated(tag: TagFields): number {
  return tag[LAST_UPDATED_FIELD];
}
