import type { Direction } from '@snake/shared';
import { CANONICAL_DIRECTIONS } from './graph.js';
import { simulateMove, type SimulatedState } from './simulation.js';

export interface LookaheadConfig { readonly depth: number; readonly nodeBudget: number }
export interface LookaheadResult { readonly predictedSurvivalTicks: number; readonly nodesEvaluated: number; readonly budgetExhausted: boolean; readonly forcedDeath: boolean }

interface SearchContext { nodes: number; exhausted: boolean; readonly budget: number }

function visit(state: SimulatedState, remaining: number, ctx: SearchContext): number {
  if (remaining <= 0) return 0;
  let best = 0;
  let legalCount = 0;
  for (const direction of CANONICAL_DIRECTIONS as readonly Direction[]) {
    if (ctx.nodes >= ctx.budget) { ctx.exhausted = true; break; }
    ctx.nodes += 1;
    const step = simulateMove(state, direction);
    if (!step.legal || !step.state) continue;
    legalCount += 1;
    best = Math.max(best, 1 + visit(step.state, remaining - 1, ctx));
  }
  return legalCount === 0 ? 0 : best;
}

export function evaluateSurvivalLookahead(state: SimulatedState, config: LookaheadConfig): LookaheadResult {
  const depth = Math.max(0, Math.floor(config.depth));
  const budget = Math.max(0, Math.floor(config.nodeBudget));
  const ctx: SearchContext = { nodes: 0, exhausted: false, budget };
  const predictedSurvivalTicks = visit(state, depth, ctx);
  return {
    predictedSurvivalTicks,
    nodesEvaluated: ctx.nodes,
    budgetExhausted: ctx.exhausted || (budget > 0 && ctx.nodes >= budget && predictedSurvivalTicks < depth),
    forcedDeath: predictedSurvivalTicks < depth && !ctx.exhausted,
  };
}
