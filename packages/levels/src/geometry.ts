import type { Vec2 } from '@snake/shared';

export type GeometryPattern = 'wall' | 'corridors' | 'crossroads' | 'islands' | 'maze' | 'labyrinth' | 'ring' | 'seeded-grid';

export function mixSeed(seed: number, ...values: readonly number[]): number {
  let h = seed >>> 0;
  for (const value of values) {
    h = Math.imul((h ^ (value >>> 0)) >>> 0, 0x45d9f3b) >>> 0;
    h ^= h >>> 16;
  }
  return h >>> 0;
}

const dedupeAndSort = (cells: readonly Vec2[], width: number, height: number): readonly Vec2[] => {
  const seen = new Set<string>();
  const result: Vec2[] = [];
  for (const cell of cells) {
    if (cell.x < 0 || cell.x >= width || cell.y < 0 || cell.y >= height) continue;
    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ x: cell.x, y: cell.y });
  }
  result.sort((a, b) => a.y - b.y || a.x - b.x);
  return result;
};

export function generateGeometry(pattern: GeometryPattern, width: number, height: number, seed = 1, density = 0.15): readonly Vec2[] {
  const cells: Vec2[] = [];
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);

  if (pattern === 'wall') {
    for (let y = 1; y < height - 1; y += 1) if (y !== midY) cells.push({ x: midX, y });
  } else if (pattern === 'corridors') {
    for (let y = 2; y < height - 1; y += 3) {
      const gap = 1 + (mixSeed(seed, y) % Math.max(1, width - 2));
      for (let x = 1; x < width - 1; x += 1) if (x !== gap) cells.push({ x, y });
    }
  } else if (pattern === 'crossroads') {
    const gapY = Math.max(1, midY - 2);
    const gapX = Math.min(width - 2, midX + 2);
    for (let y = 1; y < height - 1; y += 1) if (y !== gapY && y !== midY) cells.push({ x: midX, y });
    for (let x = 1; x < width - 1; x += 1) if (x !== gapX && x !== midX) cells.push({ x, y: midY });
  } else if (pattern === 'islands') {
    const anchors = [
      { x: Math.floor(width * 0.35), y: Math.floor(height * 0.3) },
      { x: Math.floor(width * 0.7), y: Math.floor(height * 0.35) },
      { x: Math.floor(width * 0.4), y: Math.floor(height * 0.7) },
      { x: Math.floor(width * 0.75), y: Math.floor(height * 0.72) },
    ];
    for (const anchor of anchors) for (const dy of [0, 1]) for (const dx of [0, 1]) cells.push({ x: anchor.x + dx, y: anchor.y + dy });
  } else if (pattern === 'maze' || pattern === 'labyrinth') {
    for (let x = 3; x < width - 2; x += 3) {
      const gap = pattern === 'maze' ? 1 + (mixSeed(seed, x) % Math.max(1, height - 2)) : 1 + (((x / 3) % 2 === 0 ? height - 4 : 2) % Math.max(2, height - 2));
      for (let y = 1; y < height - 1; y += 1) if (Math.abs(y - gap) > (pattern === 'labyrinth' ? 0 : 1)) cells.push({ x, y });
    }
    if (pattern === 'labyrinth') {
      for (let y = 4; y < height - 2; y += 4) {
        const gap = 2 + (mixSeed(seed, y, 99) % Math.max(1, width - 4));
        for (let x = 2; x < width - 2; x += 1) if (Math.abs(x - gap) > 1) cells.push({ x, y });
      }
    }
  } else if (pattern === 'ring') {
    const inset = Math.max(2, Math.min(4, Math.floor(Math.min(width, height) / 4)));
    for (let x = inset; x < width - inset; x += 1) {
      cells.push({ x, y: inset }, { x, y: height - inset - 1 });
    }
    for (let y = inset + 1; y < height - inset - 1; y += 1) {
      cells.push({ x: inset, y }, { x: width - inset - 1, y });
    }
    cells.splice(Math.floor(cells.length / 3), 2);
  } else {
    const threshold = Math.max(0, Math.min(1, density));
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const unit = mixSeed(seed, x, y) / 0xffffffff;
        if (unit < threshold) cells.push({ x, y });
      }
    }
  }

  return dedupeAndSort(cells, width, height);
}
