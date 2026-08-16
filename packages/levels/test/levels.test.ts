import { describe, expect, it } from 'vitest';
import * as levels from '../src/index.js';

describe('production level roster', () => {
  it('ships exactly twenty ordered strategic levels', () => {
    const roster = Reflect.get(levels, 'LEVELS');
    expect(Array.isArray(roster)).toBe(true);
    if (!Array.isArray(roster)) return;
    expect(roster).toHaveLength(20);
    expect(roster.map((level: { number: number }) => level.number)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(new Set(roster.map((level: { id: string }) => level.id)).size).toBe(20);
  });

  it('exposes a distinct structural mechanic fingerprint for every level', () => {
    const fingerprint = Reflect.get(levels, 'mechanicFingerprint');
    const roster = Reflect.get(levels, 'LEVELS');
    expect(typeof fingerprint).toBe('function');
    expect(Array.isArray(roster)).toBe(true);
    if (typeof fingerprint !== 'function' || !Array.isArray(roster)) return;
    const values = roster.map((level: unknown) => fingerprint(level));
    expect(new Set(values).size).toBe(20);
  });
});
