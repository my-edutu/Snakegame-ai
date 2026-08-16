export type Result<T, E> = Readonly<{ ok: true; value: T } | { ok: false; error: E }>;
