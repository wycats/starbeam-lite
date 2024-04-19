import type {
  FormulaTag as FormulaTagFields,
  StorageTag as StorageTagFields,
  Subscription as ISubscription,
} from "@starbeam-lite/shared/kernel";
import {
  DEPENDENCIES_FIELD,
  SUBSCRIPTIONS_FIELD,
} from "@starbeam-lite/shared/kernel";

import { unwrap } from "../utils/assert.js";
import type { TagSnapshot } from "./tag.js";

export type Unsubscribe = () => void;
export type NotifyReady = () => void;

export function updated(formula: FormulaTagFields, tags: TagSnapshot): void {
  const subscription = formula[SUBSCRIPTIONS_FIELD];
  if (subscription) {
    const diff = subscription.updated(tags);

    for (const tag of diff.add) {
      tag[SUBSCRIPTIONS_FIELD]?.add(subscription);
    }

    for (const tag of diff.remove) {
      tag[SUBSCRIPTIONS_FIELD]?.delete(subscription);
    }
  }
}
export function notify(tag: StorageTagFields): void {
  const subscriptions = tag[SUBSCRIPTIONS_FIELD];
  if (subscriptions) {
    for (const subscription of subscriptions) {
      subscription.notify();
    }
  }
}

export function subscribe(
  formula: FormulaTagFields,
  ready: NotifyReady
): Unsubscribe {
  const dependencies = formula[DEPENDENCIES_FIELD];
  const subscription = (formula[SUBSCRIPTIONS_FIELD] ??= new Subscription());

  for (const dependency of dependencies) {
    const subscriptions = (dependency[SUBSCRIPTIONS_FIELD] ??= new Set());
    subscriptions.add(subscription);
  }

  subscription.subscribe(ready);

  return () => void unsubscribeFormula(formula, ready);
}

export function unsubscribeFormula(
  formula: FormulaTagFields,
  ready: NotifyReady
): void {
  unwrap(formula[SUBSCRIPTIONS_FIELD]).unsubscribe(ready);
}

/**
 * A subscription represents a set of ready callbacks associated with a
 * particular formula. The ready callbacks are called when:
 *
 * - The formula is initialized
 * - The formula's dependencies are updated
 */
export class Subscription implements ISubscription {
  #dependencies: ReadonlySet<StorageTagFields> | undefined;
  readonly #ready = new Set<NotifyReady>();

  /**
   * Add a callback to be called when the formula is ready.
   */
  subscribe(ready: NotifyReady): void {
    this.#ready.add(ready);
  }

  /**
   * Remove a callback from being called when the formula is ready.
   */
  unsubscribe(ready: NotifyReady): void {
    this.#ready.delete(ready);
  }

  /**
   * Notify all ready callbacks.
   */
  notify(): void {
    for (const ready of this.#ready) {
      ready();
    }
  }

  /**
   * The formula's dependencies have been updated.
   *
   * This function returns a diff between the old and new dependencies, which
   * contains a list of added and removed dependencies.
   */
  updated(nextArray: TagSnapshot): Diff<StorageTagFields> {
    const prev = this.#dependencies;
    const next = new Set(nextArray);
    this.#dependencies = next;

    return diff(prev, next);
  }
}

export interface Diff<T> {
  readonly add: ReadonlySet<T>;
  readonly remove: ReadonlySet<T>;
}

function diff<T>(
  prev: Set<T> | ReadonlySet<T> | undefined,
  next: Set<T> | ReadonlySet<T>
): Diff<T> {
  if (prev === undefined) {
    return {
      add: next,
      remove: new Set(),
    };
  }

  const add = new Set<T>();
  const remove = new Set<T>();

  for (const internal of prev) {
    if (!next.has(internal)) {
      remove.add(internal);
    }
  }

  for (const internal of next) {
    if (!prev.has(internal)) {
      add.add(internal);
    }
  }

  return { add, remove };
}
