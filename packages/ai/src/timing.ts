export interface Clock {
  now(): number;
}

export interface TimedResult<T> {
  readonly value: T;
  readonly elapsedMs: number;
}

export function withTiming<T>(operation: () => T, clock: Clock): TimedResult<T> {
  const startedAt = clock.now();
  const value = operation();
  const finishedAt = clock.now();
  return { value, elapsedMs: Math.max(0, finishedAt - startedAt) };
}
