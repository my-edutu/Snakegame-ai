import { LEVELS } from './definitions.js';
import type { LevelDefinition } from './schema.js';
import { validateLevelDefinition } from './validate.js';

const clone = (level: LevelDefinition): LevelDefinition => structuredClone(level);

export interface LevelRegistry {
  list(): readonly LevelDefinition[];
  get(id: string): LevelDefinition | undefined;
  getByNumber(number: number): LevelDefinition | undefined;
}

export function registerLevels(levels: readonly LevelDefinition[]): LevelRegistry {
  const byId = new Map<string, LevelDefinition>();
  const byNumber = new Map<number, LevelDefinition>();
  for (const level of levels) {
    validateLevelDefinition(level);
    if (byId.has(level.id)) throw new Error(`Duplicate level id: ${level.id}`);
    if (byNumber.has(level.number)) throw new Error(`Duplicate level number: ${level.number}`);
    byId.set(level.id, clone(level)); byNumber.set(level.number, clone(level));
  }
  const ordered = [...byNumber.values()].sort((a, b) => a.number - b.number);
  return {
    list: () => ordered.map(clone),
    get: (id) => { const item = byId.get(id); return item ? clone(item) : undefined; },
    getByNumber: (number) => { const item = byNumber.get(number); return item ? clone(item) : undefined; },
  };
}

const registry = registerLevels(LEVELS);
export const listLevels = (): readonly LevelDefinition[] => registry.list();
export const getLevel = (id: string): LevelDefinition | undefined => registry.get(id);
export const getLevelByNumber = (number: number): LevelDefinition | undefined => registry.getByNumber(number);
