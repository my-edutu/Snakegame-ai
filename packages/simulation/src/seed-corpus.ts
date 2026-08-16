const UINT32_MAX = 0xffff_ffff;
const MAX_CORPUS_SIZE = 1_000_000;

function assertCount(count: number): void {
  if (!Number.isInteger(count) || count < 1 || count > MAX_CORPUS_SIZE) {
    throw new RangeError(`Seed corpus count must be an integer in 1..${MAX_CORPUS_SIZE}.`);
  }
}

function normalizeSeed(seed: number): number {
  if (!Number.isInteger(seed) || !Number.isFinite(seed)) throw new TypeError('Seed must be a finite integer.');
  return seed >>> 0;
}

function nextXorshift32(value: number): number {
  let x = value >>> 0;
  if (x === 0) x = 0x6d2b79f5;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function generateSeedCorpus(corpusSeed: number, count: number): readonly number[] {
  assertCount(count);
  let state = normalizeSeed(corpusSeed);
  const seen = new Set<number>();
  const seeds: number[] = [];
  while (seeds.length < count) {
    state = nextXorshift32(state);
    if (!seen.has(state)) {
      seen.add(state);
      seeds.push(state);
    }
  }
  return seeds;
}

export function validateExplicitSeeds(seeds: readonly number[]): readonly number[] {
  assertCount(seeds.length);
  return seeds.map((seed) => normalizeSeed(seed));
}

export const seedCorpusLimits = Object.freeze({ maxCount: MAX_CORPUS_SIZE, maxSeed: UINT32_MAX });
