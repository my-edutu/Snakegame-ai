import type { RegistryLookup } from './skins.js';

export interface QualityPreset {
  readonly id: 'performance' | 'balanced' | 'cinematic';
  readonly name: string;
  readonly particleCapacity: number;
  readonly trailLength: number;
  readonly glowStrength: number;
  readonly ambientDensity: number;
}

const PRESETS: readonly QualityPreset[] = [
  { id: 'performance', name: 'Performance', particleCapacity: 96, trailLength: 8, glowStrength: 0.2, ambientDensity: 0.25 },
  { id: 'balanced', name: 'Balanced', particleCapacity: 256, trailLength: 18, glowStrength: 0.5, ambientDensity: 0.6 },
  { id: 'cinematic', name: 'Cinematic', particleCapacity: 512, trailLength: 32, glowStrength: 0.82, ambientDensity: 1 },
];

const clone = (preset: QualityPreset): QualityPreset => ({ ...preset });

export const listQualityPresets = (): readonly QualityPreset[] => PRESETS.map(clone);

export const getQualityPreset = (id: string): RegistryLookup<QualityPreset> => {
  const found = PRESETS.find((preset) => preset.id === id);
  if (found) return { value: clone(found) };
  return { value: clone(PRESETS[1]!), warning: `Unknown quality preset '${id}', using balanced.` };
};
