import { describe, expect, it } from 'vitest';
import * as levels from '../src/index.js';

const get = (name: string): unknown => Reflect.get(levels, name);

describe('deterministic level geometry and registry', () => {
  it('exports deterministic geometry compilation', () => {
    expect(typeof get('generateGeometry')).toBe('function');
    expect(typeof get('compileLevel')).toBe('function');
    expect(typeof get('listLevels')).toBe('function');
  });
});
