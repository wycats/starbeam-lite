/**
 * The {@linkcode StorageTag#type} and {@linkcode FormulaTag#type} properties
 * allow `MutableTag` and `FormulaTag` to be differentiated from each other
 * without having to rely on concrete instance checks, which allows different
 * implementations of `MutableTag` and `FormulaTag` to interoperate.
 *
 * This also means that {@linkcode Tag} can be used as a discriminated union
 * in TypeScript.
 *
 * @see {https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions}
 */
export type Tag = StorageTag | FormulaTag;

export const FROZEN_STORAGE_TYPE = 0b00;
export type FROZEN_STORAGE_TYPE = 0b00;
export const MUTABLE_STORAGE_TYPE = 0b01;
export type MUTABLE_STORAGE_TYPE = 0b01;

/**
 * You can determine that a tag is a storage type by checking the most
 * significant bit: `!(type & IS_FORMULA)`
 */
export type STORAGE_TYPE = MUTABLE_STORAGE_TYPE | FROZEN_STORAGE_TYPE;

export const UNINITIALIZED_FORMULA_TYPE = 0b10;
export type UNINITIALIZED_FORMULA_TYPE = 0b10;
export const INITIALIZED_FORMULA_TYPE = 0b11;
export type INITIALIZED_FORMULA_TYPE = 0b11;

export const IS_FORMULA = 0b10;

/**
 * You can determine that a tag is a formula type by checking the most
 * significant bit: `type & IS_FORMULA`
 */
export type FORMULA_TYPE =
  | INITIALIZED_FORMULA_TYPE
  | UNINITIALIZED_FORMULA_TYPE;

export const TYPE_FIELD = 0;
export type TYPE_FIELD = 0;

/**
 * The last updated slot in both {@linkcode StorageTag} and
 * {@linkcode FormulaTag}.
 */
export const LAST_UPDATED_FIELD = 1;
export type LAST_UPDATED_FIELD = 1;

export const SUBSCRIPTIONS_FIELD = 2;
export type SUBSCRIPTIONS_FIELD = 2;

export type StorageTag = [
  type: STORAGE_TYPE,
  lastUpdated: number,
  subscriptions: Set<Subscription> | null,
];

// export interface MutableTag {
//   readonly type: "mutable";

//   /**
//    * Concrete subscriptions are managed by the runtime, and the only important
//    * thing about them for interop is their `notify` method.
//    *
//    * Semantics: An implementation MUST ensure that a mutable tag's subscriptions
//    * reflect the current set of formulas that depend on the mutable value
//    * associated with this mutable tag.
//    *
//    * Whenever a formula is recomputed, an implementation MUST remove
//    * subscriptions from mutable tags that were no longer consumed by the formula
//    * and MUST add subscriptions to mutable tags that were newly consumed by the
//    * formula.
//    *
//    * This MUST occur before any subscriptions are notified.
//    */
//   subscriptions: Set<Subscription> | undefined;

//   /**
//    * The `dependency` property is `null` if the mutable tag is frozen.
//    * Otherwise, it's the tag itself. This property can be used as a frozen
//    * check, so it should not be cheap to compute.
//    */
//   readonly dependency: MutableTag | null;

//   /**
//    * The last time the mutable tag was updated.
//    *
//    * @see {mark}
//    */
//   readonly lastUpdated: number;

//   /**
//    * Indicates that the mutable value associated with the mutable tag has been
//    * accessed. This should call the `consume()` kernel method but can be used by
//    * high level abstractions to implement subtle behavior (such as `untracked`).
//    */
//   consume: () => void;

//   /**
//    * Indicates that the mutable value associated with the mutable tag has been
//    * updated. This should result in an update to the `lastUpdated` property to a
//    * new value computed by the `bump()` kernel function.
//    *
//    * A mutable tag implementation MUST call the `notify()`
//    */
//   mark: () => void;

//   /**
//    * Indicates that the mutable value associated with the mutable tag can no
//    * longer change. This does *not* count as a mutation, as changing a value
//    * from mutable to immutable does not change the result of a computation that
//    * used the mutable value.
//    *
//    * This operation should result in turning the {@linkcode
//    * MutableTag#dependency} property to `null`.
//    *
//    * Semantics: When a mutable tag is frozen, its {@linkcode lastUpdated}
//    * property MUST not change in the future. The value associated with a frozen
//    * mutable tag MUST remain equivalent indefinitely.
//    *
//    * Implementation note: Frozen tags MUST NOT be added to the current tag set,
//    * which means that even if they (incorrectly) change, the change will not
//    * invalidated any formulas that use them.
//    */
//   freeze: () => void;
// }

export type FormulaTag = [
  type: FORMULA_TYPE,
  lastUpdated: number,
  subscriptions: Subscription | null,
  dependencies: readonly StorageTag[],
];

export const DEPENDENCIES_FIELD = 3;
export type DEPENDENCIES_FIELD = 3;

// export interface FormulaTag {
//   readonly type: "formula";

//   /**
//    * Concrete subscriptions are managed by the runtime, and the only important
//    * thing about them for interop is their `notify` method.
//    *
//    * Semantics: An implementation MUST ensure that a formula tag's subscriptions
//    * reflect the current set of mutable tags that the formula tag depends on.
//    *
//    * This MUST occur before any subscriptions are notified.
//    */
//   subscriptions: Set<Subscription> | undefined;

//   /**
//    * After the formula associated with this tag has been computed, a reactive
//    * value implementation MUST call `updated()` with the new list of
//    * dependencies.
//    *
//    * When this method is called for the first time, a formula tag implementation
//    * MUST
//    */
//   updated: (tags: TagSnapshot) => void;
// }

export type NotifyReady = () => void;

export interface Subscription {
  /**
   * Whenever a mutable tag is marked, a runtime implementation MUST notify all
   * ready callbacks synchronously.
   *
   * Note: A reactive value implementation may choose not to mark its associated
   * mutable tag if the value has not semantic ally changed according to the
   * semantics of the implementation. For example, an implementation may choose
   * to expose an `equals` option, which would allow users to specify a function
   * that determines if two values are semantically equal. In this case, the
   * implementation would not mark the mutable tag if the function returns
   * `true` when comparing the current value with the new value.
   *
   * In practice, this allows reactive value implementations and users to decide
   * that the difference between two values is semantically insignificant, and
   * would therefore not affect the results of any formulas that depend on the
   * mutable value.
   */
  notify: () => void;

  updated: (tags: readonly StorageTag[]) => {
    readonly add: ReadonlySet<StorageTag>;
    readonly remove: ReadonlySet<StorageTag>;
  };

  initialized: (dependencies: readonly StorageTag[]) => void;

  /**
   * Register a callback to be called when the formula is ready. A runtime
   * implementation MUST call
   */
  subscribe: (ready: NotifyReady) => void;

  unsubscribe: (ready: NotifyReady) => void;
}
