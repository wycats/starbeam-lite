import * as shared from "@starbeam-lite/shared";
import type { EventRecorder } from "@workspace/test-utils";

import { MutableTag } from "./cell.js";
import { FormulaTag } from "./formula.js";
import { Subscriptions } from "./subscriptions.js";
import type { Tag } from "./tag.js";

class Runtime {
  readonly #subscriptions = new Subscriptions();

  readonly subscribe = this.#subscriptions.subscribe;
  readonly updated = this.#subscriptions.updated;
  readonly initialized = this.#subscriptions.initialized;
  readonly notify = this.#subscriptions.notify;
}

export const consume = shared.consume<Tag>;
export const start = shared.start<Tag>;

const { subscribe, notify, updated, initialized } = new Runtime();
export { initialized, notify, subscribe, updated };

if (import.meta.vitest) {
  const { test, describe } = import.meta.vitest;

  const it = test.extend<{
    ctx: {
      events: EventRecorder;
      mutable: MutableTag;
      formula: FormulaTag;
      runtime: Runtime;
      unsubscribe: () => void;
      record: {
        update: (revision: number) => void;
      };
    };
  }>({
    // eslint-disable-next-line no-empty-pattern
    ctx: async ({}, use) => {
      const { EventRecorder } = await import("@workspace/test-utils");
      const { MutableTag } = await import("./cell.js");

      // creating a new instance of Runtime here verifies that the
      // implementations of `Cell` and `Formula` do not rely on the runtime
      // being a singleton.
      const runtime = new Runtime();

      const events = new EventRecorder();
      const mutable = MutableTag.create();
      const formula = new FormulaTag();

      const ready = () => {
        events.record("ready");
      };

      const unsubscribe = runtime.subscribe(formula, ready);

      // nothing happens immediately after subscribing
      events.expect([]);

      const initial = shared.now();

      function recordUpdate(revision: number) {
        events.record(`update:${revision - initial}`);
      }

      return use({
        runtime,
        events,
        mutable,
        formula,
        unsubscribe,
        record: { update: recordUpdate },
      });
    },
  });

  describe("the runtime", () => {
    it("notifies when a subscribed mutable tag is updated", ({
      ctx: { events, mutable, formula, unsubscribe, runtime },
    }) => {
      // initializing a formula notifies ready callbacks
      formula.updated([mutable]);
      events.expect("ready");

      // marking a cell updates the formula, but *before* notifying ready
      runtime.notify(mutable);
      events.expect("ready");

      // unsubscribing removes the ready callback, but doesn't notify
      // subscribers.
      unsubscribe();
      events.expect([]);

      // marking a dependency updates the cell, but doesn't notify subscribers
      runtime.notify(mutable);
      events.expect([]);
    });

    it("doesn't notify if the formula no longer has the relevant dependency", ({
      ctx: { events, mutable, formula, unsubscribe, runtime },
    }) => {
      const second = MutableTag.create();

      // Initializing a formula notifies ready callbacks, as initialization is
      // semantically equivalent to a mutable tag being updated.
      formula.updated([mutable]);
      events.expect("ready");

      // Notifying a mutable tag that is a dependency of a formula notifies the
      // formula's subscribers.
      runtime.notify(mutable);
      events.expect("ready");

      // Updating the formula doesn't notify subscribers, as formulas are only
      // updated when read, in response to a prior notification.
      formula.updated([second]);
      events.expect([]);

      // Notifying a mutable tag that is no longer a dependency does not notify
      // the formula's subscribers.
      runtime.notify(mutable);
      events.expect([]);

      // Notifying a mutable tag that is newly a dependency notifies the
      // formula's subscribers.
      runtime.notify(second);
      events.expect("ready");

      // Unsubscribing removes the ready callback, but doesn't notify
      // subscribers.
      unsubscribe();
      events.expect([]);

      // Notifying a mutable tag that is no longer a dependency still does not
      // notify the formula's subscribers.
      runtime.notify(mutable);
      events.expect([]);

      // Notifying a mutable tag that is still a dependency after unsubscribing
      // does not notify the formula's (no longer active) subscribers.
      runtime.notify(second);
      events.expect([]);
    });
  });
}
