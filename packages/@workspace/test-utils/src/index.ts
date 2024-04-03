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
