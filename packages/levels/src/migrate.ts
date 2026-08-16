import { parseLevelDefinition, type LevelDefinition } from './schema.js';

export function migrateLevelDefinition(input: unknown): LevelDefinition {
  if (typeof input !== 'object' || input === null) throw new Error('Level definition must be an object.');
  const version = Reflect.get(input, 'schemaVersion');
  if (version !== 1) throw new Error(`Unsupported level schema version: ${String(version)}`);
  return parseLevelDefinition(input);
}
