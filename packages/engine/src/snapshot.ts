import type { EngineSnapshot } from './state.js';

export function serializeSnapshot(snapshot: EngineSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseSnapshot(serialized: string): EngineSnapshot {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid engine snapshot.');
  const candidate = parsed as Partial<EngineSnapshot>;
  if (candidate.schemaVersion !== 1 || !candidate.config || !candidate.state) throw new Error('Unsupported or malformed engine snapshot.');
  return candidate as EngineSnapshot;
}
