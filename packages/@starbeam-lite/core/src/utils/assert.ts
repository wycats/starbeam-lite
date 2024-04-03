export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (import.meta.env.DEV && !condition) {
    throw new Error(message);
  }
}

export function unwrap<T>(value: T | undefined | null): T {
  if ((import.meta.env.DEV && value === undefined) || value === null) {
    throw new Error("Attempted to unwrap a null or undefined value");
  }

  return value as T;
}
