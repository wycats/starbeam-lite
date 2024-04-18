export { bump, now } from "./clock.js";
export type { SharedContext } from "./coordination.js";
export type { Stack } from "./stack.js";
export { begin, commit, consume } from "./stack.js";
export const TAG = Symbol.for("starbeam.TAG");
export type TAG = typeof TAG;
