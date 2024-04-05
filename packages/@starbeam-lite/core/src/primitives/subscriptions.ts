import { unwrap } from "../utils/assert.js";
import type { MutableTag } from "./cell.js";
import type { FormulaTag } from "./formula.js";
import type { TagSnapshot } from "./tag.js";

export type Unsubscribe = () => void;
export type NotifyReady = () => void;

export class Subscriptions {
  readonly subscribe = (
    target: FormulaTag,
    ready: NotifyReady
  ): Unsubscribe => {
    this.#subscribe(target, ready);

    return () => void this.#unsubscribe(target, ready);
  };

  readonly initialized = (target: FormulaTag): void => {
    const subscription = target.subscription;

    if (subscription) {
      for (const added of target.dependencies) {
        this.#getDependencySubscriptions(added).add(subscription);
      }

      subscription.initialized(target.dependencies);
      subscription.notify();
    }
  };

  readonly updated = (formula: FormulaTag): void => {
    const subscription = formula.subscription;

    if (subscription) {
      const diff = subscription.updated(formula.dependencies);

      for (const added of diff.add) {
        this.#getDependencySubscriptions(added).add(subscription);
      }

      for (const removed of diff.remove) {
        this.#getDependencySubscriptions(removed).delete(subscription);
      }
    }
  };

  readonly notify = (tag: MutableTag): void => {
    const dependency = tag.dependency;

    if (dependency) {
      this.#notify(dependency);
    }
  };

  #notify(dependency: MutableTag) {
    const subscriptions = dependency.subscriptions;

    if (subscriptions) {
      for (const subscription of subscriptions) {
        subscription.notify();
      }
    }
  }

  #unsubscribe(target: FormulaTag, ready: NotifyReady): void {
    unwrap(target.subscription).unsubscribe(ready);
  }

  #subscribe(target: FormulaTag, ready: NotifyReady): void {
    const dependencies = target.dependencies;
    const subscription = this.#getFormulaSubscription(target);

    for (const dependency of dependencies) {
      this.#getDependencySubscriptions(dependency).add(subscription);
    }

    subscription.subscribe(ready);
  }

  #getFormulaSubscription(tag: FormulaTag): Subscription {
    return (tag.subscription ??= new Subscription());
  }

  #getDependencySubscriptions(tag: MutableTag): Set<Subscription> {
    return (tag.subscriptions ??= new Set());
  }
}

/**
 * A subscription represents a set of ready callbacks associated with a
 * particular formula. The ready callbacks are called when:
 *
 * - The formula is initialized
 * - The formula's dependencies are updated
 */
export class Subscription {
  #dependencies: ReadonlySet<MutableTag> | undefined;
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
   * The formula was initialized, and its initial dependencies have been
   * computed.
   */
  initialized(dependencies: Iterable<MutableTag>): void {
    this.#dependencies = new Set(dependencies);
  }

  /**
   * The formula's dependencies have been updated.
   *
   * This function returns a diff between the old and new dependencies, which
   * contains a list of added and removed dependencies.
   */
  updated(nextArray: TagSnapshot<MutableTag>): Diff<MutableTag> {
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
