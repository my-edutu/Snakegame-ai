export const PREVIEW_VIEWPORTS = {
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
} as const;

export type PreviewViewportId = keyof typeof PREVIEW_VIEWPORTS;

const PRESENTATION_ONLY_SETTINGS = new Set(['skin', 'theme', 'quality', 'viewport']);

export const isPresentationOnlySetting = (key: string): boolean => PRESENTATION_ONLY_SETTINGS.has(key);
