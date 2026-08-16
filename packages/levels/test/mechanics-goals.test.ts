import { describe, expect, it } from 'vitest';
import * as levels from '../src/index.js';

describe('mechanics and progression domain', () => {
  it('exports pure deterministic mechanic and goal evaluators', () => {
    expect(typeof Reflect.get(levels, 'resolveMechanics')).toBe('function');
    expect(typeof Reflect.get(levels, 'evaluateProgression')).toBe('function');
  });
});
