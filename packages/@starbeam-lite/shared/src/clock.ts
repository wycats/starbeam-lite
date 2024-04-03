import type { SharedContext } from "./coordination.js";
import { buildSharedContext } from "./coordination.js";

const context = buildSharedContext();
const INITIAL_TIMESTAMP = 1;

context.now ??= INITIAL_TIMESTAMP;

export const now = (): number => context.now as number;
export const bump = (): number => ++(context as SharedContext).now;
