import { describe, expect, it } from 'vitest';
import { getQualityPreset, listQualityPresets } from '../src/quality.js';
import { getSnakeSkin, listSnakeSkins } from '../src/skins.js';
import { getTheme, listThemes } from '../src/themes.js';

describe('renderer style registries', () => {
  it('contains exactly the seven required snake skins', () => {
    expect(listSnakeSkins().map((skin) => skin.id)).toEqual([
      'emerald', 'neon', 'inferno', 'galaxy', 'gold', 'rainbow', 'void',
    ]);
  });

  it('contains exactly the eleven required themes', () => {
    expect(listThemes().map((theme) => theme.id)).toEqual([
      'neon-grid', 'digital-forest', 'volcano', 'arctic', 'cyber-city', 'desert',
      'deep-ocean', 'space', 'matrix', 'ancient-temple', 'cosmic-void',
    ]);
  });

  it('returns safe defaults and warnings for unknown style ids', () => {
    expect(getSnakeSkin('does-not-exist')).toMatchObject({ value: { id: 'emerald' }, warning: expect.any(String) });
    expect(getTheme('does-not-exist')).toMatchObject({ value: { id: 'neon-grid' }, warning: expect.any(String) });
    expect(getQualityPreset('does-not-exist')).toMatchObject({ value: { id: 'balanced' }, warning: expect.any(String) });
  });

  it('keeps quality resource budgets monotonic', () => {
    const [performance, balanced, cinematic] = listQualityPresets();
    expect(performance!.particleCapacity).toBeLessThanOrEqual(balanced!.particleCapacity);
    expect(balanced!.particleCapacity).toBeLessThanOrEqual(cinematic!.particleCapacity);
    expect(performance!.trailLength).toBeLessThanOrEqual(balanced!.trailLength);
    expect(balanced!.trailLength).toBeLessThanOrEqual(cinematic!.trailLength);
    expect(performance!.glowStrength).toBeLessThanOrEqual(balanced!.glowStrength);
    expect(balanced!.glowStrength).toBeLessThanOrEqual(cinematic!.glowStrength);
  });
});
