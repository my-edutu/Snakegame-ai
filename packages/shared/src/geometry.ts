export type Vec2 = Readonly<{ x: number; y: number }>;

export function addVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function equalVec(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}
