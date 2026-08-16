import type { RegistryLookup } from './skins.js';

export interface EnvironmentTheme {
  readonly id: string;
  readonly name: string;
  readonly background: string;
  readonly board: string;
  readonly grid: string;
  readonly obstacle: string;
  readonly hazard: string;
  readonly portal: string;
  readonly ambient: string;
  readonly gridAlpha: number;
  readonly vignetteAlpha: number;
}

const THEMES: readonly EnvironmentTheme[] = [
  { id: 'neon-grid', name: 'Neon Grid', background: '#050716', board: '#0A1028', grid: '#1B6BFF', obstacle: '#30466F', hazard: '#FF3D71', portal: '#B05CFF', ambient: '#18D5FF', gridAlpha: 0.18, vignetteAlpha: 0.35 },
  { id: 'digital-forest', name: 'Digital Forest', background: '#04120D', board: '#082119', grid: '#1C6B48', obstacle: '#31594A', hazard: '#FFB020', portal: '#5FE3A1', ambient: '#3CFF9C', gridAlpha: 0.14, vignetteAlpha: 0.32 },
  { id: 'volcano', name: 'Volcano', background: '#160604', board: '#27100A', grid: '#71311E', obstacle: '#5A3A32', hazard: '#FF4A1C', portal: '#FFB13B', ambient: '#FF6B28', gridAlpha: 0.16, vignetteAlpha: 0.42 },
  { id: 'arctic', name: 'Arctic', background: '#06121D', board: '#0B2334', grid: '#6ACDFF', obstacle: '#547A92', hazard: '#FF5F8E', portal: '#AFD9FF', ambient: '#D1F5FF', gridAlpha: 0.15, vignetteAlpha: 0.25 },
  { id: 'cyber-city', name: 'Cyber City', background: '#080617', board: '#15102B', grid: '#FF3DD3', obstacle: '#435075', hazard: '#FF315D', portal: '#30E8FF', ambient: '#8B5CFF', gridAlpha: 0.17, vignetteAlpha: 0.38 },
  { id: 'desert', name: 'Desert', background: '#1A1006', board: '#2B1B0B', grid: '#C49048', obstacle: '#8D6540', hazard: '#FF5A2A', portal: '#FFD35C', ambient: '#E7B568', gridAlpha: 0.13, vignetteAlpha: 0.28 },
  { id: 'deep-ocean', name: 'Deep Ocean', background: '#020912', board: '#041927', grid: '#11658A', obstacle: '#315C70', hazard: '#FF4B86', portal: '#35E1E8', ambient: '#1FBDE1', gridAlpha: 0.13, vignetteAlpha: 0.43 },
  { id: 'space', name: 'Space', background: '#03040A', board: '#090C18', grid: '#2A3867', obstacle: '#44506A', hazard: '#FF4E6D', portal: '#8C73FF', ambient: '#BAC7FF', gridAlpha: 0.11, vignetteAlpha: 0.47 },
  { id: 'matrix', name: 'Matrix', background: '#010A05', board: '#03140A', grid: '#10B956', obstacle: '#1B4F31', hazard: '#FF445E', portal: '#50FF8A', ambient: '#15E56B', gridAlpha: 0.19, vignetteAlpha: 0.38 },
  { id: 'ancient-temple', name: 'Ancient Temple', background: '#0E0A05', board: '#1D160C', grid: '#8E6C35', obstacle: '#786245', hazard: '#E15241', portal: '#E9C66A', ambient: '#C99B4B', gridAlpha: 0.12, vignetteAlpha: 0.35 },
  { id: 'cosmic-void', name: 'Cosmic Void', background: '#020107', board: '#090617', grid: '#3B267A', obstacle: '#3A3457', hazard: '#FF3B84', portal: '#B76BFF', ambient: '#6434D9', gridAlpha: 0.15, vignetteAlpha: 0.5 },
];

const clone = (theme: EnvironmentTheme): EnvironmentTheme => ({ ...theme });

export const listThemes = (): readonly EnvironmentTheme[] => THEMES.map(clone);

export const getTheme = (id: string): RegistryLookup<EnvironmentTheme> => {
  const found = THEMES.find((theme) => theme.id === id);
  if (found) return { value: clone(found) };
  return { value: clone(THEMES[0]!), warning: `Unknown theme '${id}', using neon-grid.` };
};
