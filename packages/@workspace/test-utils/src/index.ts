import { expect } from "vitest";

export class EventRecorder {
  #events: string[] = [];

  record(event: string): void {
    this.#events.push(event);
  }

  expect(...events: [[]] | string[]): void {
    expect(this.#events).toEqual(events.flat());
    this.#events = [];
  }
}

export class TestScheduler {
  readonly #queue = new Set<() => void>();

  readonly schedule = (fn: () => void): void => {
    this.#queue.add(fn);
  };

  readonly flush = (): void => {
    for (const fn of this.#queue) {
      fn();
    }
    this.#queue.clear();
  };
}
