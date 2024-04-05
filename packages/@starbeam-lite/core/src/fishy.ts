let FISHY_UNTRACKED = false;

export function untrack<T>(callback: () => T): T {
  FISHY_UNTRACKED = true;
  try {
    return callback();
  } finally {
    FISHY_UNTRACKED = false;
  }
}

export function isFishyUntracked(): boolean {
  if (import.meta.env.MODE === "test") {
    return FISHY_UNTRACKED;
  } else {
    return true;
  }
}
