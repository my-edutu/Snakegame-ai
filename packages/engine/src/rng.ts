export interface SerializedRngState {
  readonly algorithm: 'xorshift32';
  readonly state: number;
}

export interface DeterministicRng {
  nextUint32(): number;
  nextFloat(): number;
  nextInt(maxExclusive: number): number;
  serialize(): SerializedRngState;
}

class XorShift32 implements DeterministicRng {
  private state: number;

  constructor(seed: number) {
    const normalized = seed >>> 0;
    this.state = normalized === 0 ? 0x6d2b79f5 : normalized;
  }

  nextUint32(): number {
    let x = this.state >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
      throw new RangeError('maxExclusive must be a positive safe integer.');
    }
    return Math.floor(this.nextFloat() * maxExclusive);
  }

  serialize(): SerializedRngState {
    return { algorithm: 'xorshift32', state: this.state >>> 0 };
  }
}

export function createRng(seed: number): DeterministicRng {
  return new XorShift32(seed);
}

export function restoreRng(serialized: SerializedRngState): DeterministicRng {
  if (serialized.algorithm !== 'xorshift32') throw new Error(`Unsupported RNG algorithm: ${String(serialized.algorithm)}`);
  return new XorShift32(serialized.state);
}
