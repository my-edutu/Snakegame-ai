import { describe, expect, it } from 'vitest';
import { PREVIEW_VIEWPORTS, isPresentationOnlySetting } from '../src/config.js';

describe('render preview host contract', () => {
  it('defines the exact three target livestream viewport presets', () => {
    expect(PREVIEW_VIEWPORTS).toEqual({
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4k': { width: 3840, height: 2160 },
    });
  });

  it('keeps preview controls presentation-only except explicit restart', () => {
    for (const key of ['skin', 'theme', 'quality', 'viewport']) expect(isPresentationOnlySetting(key)).toBe(true);
    for (const key of ['seed', 'riskTolerance', 'failureRate', 'growthPerFood']) expect(isPresentationOnlySetting(key)).toBe(false);
  });
});
