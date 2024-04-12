import { CachedFormula, Cell, Formula } from "@starbeam-lite/core";
import { EventRecorder, TestScheduler } from "@workspace/test-utils";
import { describe, it } from "vitest";

describe("bench semantics", () => {
  it("should work", () => {
    const events = new EventRecorder();
    const scheduler = new TestScheduler();

    const head = Cell.create(0);
    let last = head as Cell<number> | Formula<number>;
    const callCounter = { count: 0 };
    for (let i = 0; i < 50; i++) {
      const current = Formula.create(() => {
        return head.read() + i;
      });
      const current2 = Formula.create(() => {
        return current.read() + 1;
      });
      const effect = SyncOut(() => {
        current2.read();
        events.record(`effect:${i}`);
      });
      scheduler.schedule(effect.read);

      last = current2;
    }

    return () => {
      bridge.withBatch(() => {
        head.write(1);
      });
      const atleast = 50 * 50;
      callCounter.count = 0;
      for (let i = 0; i < 50; i++) {
        bridge.withBatch(() => {
          head.write(i);
        });
        assert(last.read() === i + 50, "loop", i);
      }
      assert(callCounter.count === atleast, "count", callCounter.count);
    };
  });
});

function SyncOut(flush: () => void): CachedFormula<void> {
  return CachedFormula(() => {
    // in principle, this should have a write barrier
    flush();
  });
}
