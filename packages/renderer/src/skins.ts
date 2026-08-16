export interface SnakeSkin {
  readonly id: string;
  readonly name: string;
  readonly bodyStops: readonly string[];
  readonly outline: string;
  readonly headAccent: string;
  readonly glowStrength: number;
  readonly trailAlpha: number;
}

export interface RegistryLookup<T> {
  readonly value: T;
  readonly warning?: string;
}

const SKINS: readonly SnakeSkin[] = [
  { id: 'emerald', name: 'Emerald', bodyStops: ['#0BFF7A', '#B7FF45'], outline: '#DFFFF1', headAccent: '#F4FFF8', glowStrength: 0.55, trailAlpha: 0.28 },
  { id: 'neon', name: 'Neon', bodyStops: ['#12E7FF', '#246BFF', '#9D3CFF'], outline: '#BDF7FF', headAccent: '#FFFFFF', glowStrength: 0.75, trailAlpha: 0.34 },
  { id: 'inferno', name: 'Inferno', bodyStops: ['#FFE14A', '#FF7A18', '#E32636'], outline: '#FFF0BA', headAccent: '#FFF8DF', glowStrength: 0.7, trailAlpha: 0.32 },
  { id: 'galaxy', name: 'Galaxy', bodyStops: ['#278CFF', '#7755FF', '#FF4BD8'], outline: '#D9D2FF', headAccent: '#FFFFFF', glowStrength: 0.72, trailAlpha: 0.35 },
  { id: 'gold', name: 'Gold', bodyStops: ['#FFF0A5', '#F4B93B', '#A96B00'], outline: '#FFF7D6', headAccent: '#FFFFFF', glowStrength: 0.5, trailAlpha: 0.24 },
  { id: 'rainbow', name: 'Rainbow', bodyStops: ['#FF4D67', '#FFCC45', '#4DFF9A', '#40D9FF', '#9B5CFF'], outline: '#FFFFFF', headAccent: '#FFFFFF', glowStrength: 0.62, trailAlpha: 0.3 },
  { id: 'void', name: 'Void', bodyStops: ['#090A12', '#14152A'], outline: '#8D77FF', headAccent: '#D8D0FF', glowStrength: 0.8, trailAlpha: 0.4 },
];

const clone = (skin: SnakeSkin): SnakeSkin => ({ ...skin, bodyStops: [...skin.bodyStops] });

export const listSnakeSkins = (): readonly SnakeSkin[] => SKINS.map(clone);

export const getSnakeSkin = (id: string): RegistryLookup<SnakeSkin> => {
  const found = SKINS.find((skin) => skin.id === id);
  if (found) return { value: clone(found) };
  return { value: clone(SKINS[0]!), warning: `Unknown snake skin '${id}', using emerald.` };
};
