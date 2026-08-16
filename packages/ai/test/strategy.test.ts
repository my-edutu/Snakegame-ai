import { describe, expect, it } from 'vitest';
import { selectStrategy } from '../src/strategy.js';

const base = {
  emergency: false,
  allRisky: false,
  safeMoves: 3,
  riskScore: 20,
  occupancyRatio: 0.2,
  hamiltonianAvailable: false,
  hamiltonianPreservable: false,
  foodSafe: true,
  tailPreferred: false,
  expanding: false,
  recovered: false,
};

describe('hybrid strategy state machine', () => {
  it('allows emergency states to override hysteresis', () => {
    expect(selectStrategy({ mode: 'hunt', ticksInMode: 0 }, { ...base, emergency: true, safeMoves: 1 }, 6).mode).toBe('escape');
    expect(selectStrategy({ mode: 'hunt', ticksInMode: 0 }, { ...base, allRisky: true }, 6).mode).toBe('high-risk');
  });

  it('selects tail-follow, Hamiltonian, endgame, and hunt from evidence', () => {
    expect(selectStrategy({ mode: 'explore', ticksInMode: 10 }, { ...base, foodSafe: false, tailPreferred: true }, 1).mode).toBe('tail-follow');
    expect(selectStrategy({ mode: 'explore', ticksInMode: 10 }, { ...base, occupancyRatio: 0.9, hamiltonianAvailable: true, hamiltonianPreservable: true }, 1).mode).toBe('hamiltonian');
    expect(selectStrategy({ mode: 'explore', ticksInMode: 10 }, { ...base, occupancyRatio: 0.9 }, 1).mode).toBe('endgame');
    expect(selectStrategy({ mode: 'explore', ticksInMode: 10 }, base, 1).mode).toBe('hunt');
  });

  it('holds a non-emergency mode until minimum dwell is met', () => {
    const held = selectStrategy({ mode: 'explore', ticksInMode: 2 }, base, 6);
    expect(held).toEqual({ mode: 'explore', ticksInMode: 3 });
  });
});
