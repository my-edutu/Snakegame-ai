import type { Direction } from '@snake/shared';
import { CANONICAL_DIRECTIONS } from './graph.js';
import { createHamiltonianOrder, hamiltonianMovePenalty, isHamiltonianBodyOrdered } from './hamiltonian.js';
import { evaluateSurvivalLookahead } from './lookahead.js';
import type { AiObservation } from './observation.js';
import { planPathToFood } from './planners.js';
import { assessRisk, type RiskAssessment } from './risk.js';
import { analyzeSpace } from './space.js';
import { createSimulatedState, simulateMove, type SimulatedState } from './simulation.js';
import { selectStrategy, type StrategyState } from './strategy.js';

export interface SurvivalDecisionConfig {
  readonly lookaheadDepth: number;
  readonly lookaheadNodeBudget: number;
  readonly minimumSafeAreaRatio: number;
  readonly highOccupancyThreshold: number;
  readonly strategyMinDwellTicks: number;
}

export interface DecisionReason { readonly code: string; readonly message: string; readonly severity: 'info' | 'warning' | 'critical' }
export interface MoveEvaluation {
  readonly direction: Direction;
  readonly legal: boolean;
  readonly hardRejected: boolean;
  readonly reachableArea: number;
  readonly reachableAreaRatio: number;
  readonly tailReachable: boolean;
  readonly escapeRouteCount: number;
  readonly corridorDepth: number;
  readonly foodDistance: number | null;
  readonly foodSafe: boolean;
  readonly predictedSurvivalTicks: number;
  readonly hamiltonianPenalty: number;
  readonly trapProbability: number;
  readonly totalScore: number;
  readonly reasons: readonly DecisionReason[];
}
export interface SurvivalDecision {
  readonly direction: Direction | null;
  readonly strategy: StrategyState;
  readonly risk: RiskAssessment;
  readonly evaluations: readonly MoveEvaluation[];
  readonly summary: string;
  readonly nodesEvaluated: number;
  readonly budgetExhausted: boolean;
}

export const DEFAULT_SURVIVAL_DECISION_CONFIG: SurvivalDecisionConfig = {
  lookaheadDepth: 8,
  lookaheadNodeBudget: 6000,
  minimumSafeAreaRatio: 0.35,
  highOccupancyThreshold: 0.72,
  strategyMinDwellTicks: 6,
};

const ILLEGAL_MOVE_SCORE = -1_000_000_000;

interface FoodRouteSafety {
  readonly relevant: boolean;
  readonly safe: boolean;
  readonly reachableAreaRatio: number | null;
  readonly escapeRouteCount: number | null;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const finiteInteger = (value: number, fallback: number, max: number): number => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback;

function normalizeConfig(partial: Partial<SurvivalDecisionConfig>): SurvivalDecisionConfig {
  const merged = { ...DEFAULT_SURVIVAL_DECISION_CONFIG, ...partial };
  return {
    lookaheadDepth: finiteInteger(merged.lookaheadDepth, DEFAULT_SURVIVAL_DECISION_CONFIG.lookaheadDepth, 64),
    lookaheadNodeBudget: finiteInteger(merged.lookaheadNodeBudget, DEFAULT_SURVIVAL_DECISION_CONFIG.lookaheadNodeBudget, 1_000_000),
    minimumSafeAreaRatio: clamp01(merged.minimumSafeAreaRatio),
    highOccupancyThreshold: clamp01(merged.highOccupancyThreshold),
    strategyMinDwellTicks: finiteInteger(merged.strategyMinDwellTicks, DEFAULT_SURVIVAL_DECISION_CONFIG.strategyMinDwellTicks, 10_000),
  };
}

function trapScore(areaRatio: number, escapes: number, corridorDepth: number, tailReachable: boolean, forcedDeath: boolean, topology: number): number {
  return Math.max(0, Math.min(1,
    (1 - areaRatio) * 0.32 + (1 - Math.min(4, escapes) / 4) * 0.2 +
    Math.min(1, corridorDepth / 12) * 0.12 + (tailReachable ? 0 : 0.12) +
    (forcedDeath ? 0.16 : 0) + topology * 0.08,
  ));
}

function assessFoodRoute(base: SimulatedState, directions: readonly Direction[] | undefined, config: SurvivalDecisionConfig): FoodRouteSafety {
  if (!directions || directions.length === 0) return { relevant: false, safe: true, reachableAreaRatio: null, escapeRouteCount: null };
  let state = base;
  let consumed = false;
  for (const direction of directions) {
    const step = simulateMove(state, direction);
    if (!step.legal || !step.state) return { relevant: true, safe: false, reachableAreaRatio: 0, escapeRouteCount: 0 };
    state = step.state;
    consumed ||= step.consumedFoodId !== null;
  }
  if (!consumed) return { relevant: true, safe: false, reachableAreaRatio: 0, escapeRouteCount: 0 };
  const space = analyzeSpace(state);
  const safe = space.reachableAreaRatio >= config.minimumSafeAreaRatio && space.escapeRouteCount > 0 && !space.deadEnd;
  return { relevant: true, safe, reachableAreaRatio: space.reachableAreaRatio, escapeRouteCount: space.escapeRouteCount };
}

function summaryFor(strategy: StrategyState, risk: RiskAssessment, best: MoveEvaluation | undefined, rejectedFood: MoveEvaluation | undefined): string {
  if (strategy.mode === 'hamiltonian') return 'HAMILTONIAN MODE — PRESERVING ENDGAME ORDER';
  if (risk.level === 'critical' && risk.contributors.safeMoves === 0) return 'CRITICAL — NO SAFE MOVES';
  if (risk.level === 'critical' && risk.contributors.safeMoves === 1) return 'CRITICAL — 1 SAFE MOVE REMAINING';
  if (rejectedFood) return `FOOD PATH REJECTED — REACHABLE AREA ${Math.round(rejectedFood.reachableAreaRatio * 100)}%`;
  if (strategy.mode === 'tail-follow' && best) return `TAIL FOLLOW — PRESERVES ${best.escapeRouteCount} ESCAPE ROUTES`;
  return `STRATEGY: ${strategy.mode.toUpperCase().replace('-', ' ')}`;
}

export function decideSurvivalMove(observation: AiObservation, previousStrategy: StrategyState, partial: Partial<SurvivalDecisionConfig> = {}): SurvivalDecision {
  const config = normalizeConfig(partial);
  const base = createSimulatedState(observation);
  const totalCells = Math.max(1, observation.board.width * observation.board.height - observation.obstacles.length - observation.hazards.length);
  const occupancyRatio = Math.min(1, observation.body.length / totalCells);
  const highOccupancy = occupancyRatio >= config.highOccupancyThreshold;
  const hamiltonian = observation.obstacles.length === 0 && observation.hazards.length === 0 ? createHamiltonianOrder(observation.board.width, observation.board.height) : null;
  const hamiltonianBodyOrdered = hamiltonian ? isHamiltonianBodyOrdered(hamiltonian, base) : false;
  const foodPlan = planPathToFood(observation);
  const foodDirections = foodPlan.search?.route?.directions;
  const firstFoodDirection = foodDirections?.[0] ?? null;
  const plannedFoodSafety = assessFoodRoute(base, foodDirections, config);
  const perCandidateBudget = Math.floor(config.lookaheadNodeBudget / 4);
  let nodesEvaluated = 0;
  let budgetExhausted = false;

  const evaluations: MoveEvaluation[] = CANONICAL_DIRECTIONS.map((direction) => {
    const step = simulateMove(base, direction);
    if (!step.legal || !step.state) {
      return { direction, legal: false, hardRejected: true, reachableArea: 0, reachableAreaRatio: 0, tailReachable: false, escapeRouteCount: 0, corridorDepth: 0, foodDistance: null, foodSafe: false, predictedSurvivalTicks: 0, hamiltonianPenalty: 1, trapProbability: 1, totalScore: ILLEGAL_MOVE_SCORE, reasons: [{ code: 'illegal', message: 'Immediate move is illegal.', severity: 'critical' }] };
    }
    const space = analyzeSpace(step.state);
    const look = evaluateSurvivalLookahead(step.state, { depth: config.lookaheadDepth, nodeBudget: perCandidateBudget });
    nodesEvaluated += look.nodesEvaluated;
    budgetExhausted ||= look.budgetExhausted;
    const consumed = step.consumedFoodId !== null;
    const onPlannedFoodRoute = firstFoodDirection === direction && plannedFoodSafety.relevant;
    const immediateFoodSafe = !consumed || (space.reachableAreaRatio >= config.minimumSafeAreaRatio && !look.forcedDeath && space.escapeRouteCount > 0 && !space.deadEnd);
    const foodSafe = onPlannedFoodRoute ? plannedFoodSafety.safe : immediateFoodSafe;
    const trapProbability = trapScore(space.reachableAreaRatio, space.escapeRouteCount, space.corridorDepth, space.tailReachable, look.forcedDeath, space.articulationPressure);
    const hPenalty = hamiltonian && highOccupancy && hamiltonianBodyOrdered ? hamiltonianMovePenalty(hamiltonian, base, direction) : 0;
    const preservesHamiltonianOrder = Boolean(hamiltonian && highOccupancy && hamiltonianBodyOrdered && hPenalty === 0);
    const insufficientSpace = space.reachableArea < Math.min(totalCells, step.state.body.length + Math.max(2, step.state.pendingGrowth));
    const staticSpaceRejected = space.deadEnd || insufficientSpace;
    const unsafeFood = (consumed || onPlannedFoodRoute) && !foodSafe;
    const hardRejected = look.forcedDeath || unsafeFood || (staticSpaceRejected && !preservesHamiltonianOrder);
    const reasons: DecisionReason[] = [];
    if (unsafeFood) {
      const ratio = onPlannedFoodRoute ? plannedFoodSafety.reachableAreaRatio ?? 0 : space.reachableAreaRatio;
      reasons.push({ code: 'unsafe-food', message: `Food route rejected: post-growth reachable area ${Math.round(ratio * 100)}%.`, severity: 'warning' });
    }
    if (!space.tailReachable) reasons.push({ code: 'tail-unreachable', message: 'Current simulated tail is not reachable through free space.', severity: 'warning' });
    if (space.escapeRouteCount <= 1) reasons.push({ code: 'low-escape', message: `${space.escapeRouteCount} escape route remains.`, severity: space.escapeRouteCount === 0 ? 'critical' : 'warning' });
    if (preservesHamiltonianOrder && staticSpaceRejected) reasons.push({ code: 'hamiltonian-safe', message: 'Static-space pressure is tolerated because ordered cycle motion releases the tail ahead of the body.', severity: 'info' });
    else if (hPenalty > 0) reasons.push({ code: 'hamiltonian-order', message: 'Move deviates from Hamiltonian forward order.', severity: 'warning' });
    const foodProgress = firstFoodDirection === direction && foodSafe ? 8 : 0;
    const score = (space.reachableAreaRatio * 38) + (space.escapeRouteCount * 6) + (look.predictedSurvivalTicks * 3) + (space.tailReachable ? 8 : 0) + foodProgress - trapProbability * 38 - hPenalty * 42 - (hardRejected ? 1000 : 0);
    return { direction, legal: true, hardRejected, reachableArea: space.reachableArea, reachableAreaRatio: space.reachableAreaRatio, tailReachable: space.tailReachable, escapeRouteCount: space.escapeRouteCount, corridorDepth: space.corridorDepth, foodDistance: foodPlan.search?.telemetry.pathLength ?? null, foodSafe, predictedSurvivalTicks: look.predictedSurvivalTicks, hamiltonianPenalty: hPenalty, trapProbability, totalScore: score, reasons };
  });

  const legal = evaluations.filter((e) => e.legal);
  const viable = legal.filter((e) => !e.hardRejected);
  const hamiltonianForward = highOccupancy && hamiltonianBodyOrdered ? viable.find((e) => e.hamiltonianPenalty === 0) : undefined;
  const pool = hamiltonianForward ? [hamiltonianForward] : viable.length ? viable : legal;
  const best = [...pool].sort((a, b) => b.totalScore - a.totalScore || CANONICAL_DIRECTIONS.indexOf(a.direction) - CANONICAL_DIRECTIONS.indexOf(b.direction))[0];
  const safeMoves = viable.length;
  const bestArea = best?.reachableAreaRatio ?? 0;
  const bestTrap = best?.trapProbability ?? 1;
  const bestEscapes = best?.escapeRouteCount ?? 0;
  const risk = assessRisk({ safeMoves, reachableAreaRatio: bestArea, escapeRouteCount: bestEscapes, occupancyRatio, bodyPressure: 1 - bestArea, trapProbability: bestTrap, lookaheadFailure: best && best.predictedSurvivalTicks >= config.lookaheadDepth ? 0 : 1, topologyPressure: best ? Math.min(1, best.corridorDepth / 12) : 1 });
  const foodCandidates = legal.filter((e) => firstFoodDirection === e.direction);
  const foodSafe = foodCandidates.length === 0 || foodCandidates.some((e) => e.foodSafe && !e.hardRejected);
  const rejectedFood = foodCandidates.find((e) => !e.foodSafe || e.hardRejected);
  const tailPreferred = Boolean(best && !foodSafe && best.tailReachable);
  const hamiltonianPreservable = Boolean(best && hamiltonian && hamiltonianBodyOrdered && best.hamiltonianPenalty === 0 && !best.hardRejected);
  const hamiltonianAvailable = Boolean(hamiltonian && hamiltonianBodyOrdered);
  const emergencyOutsideHamiltonian = !hamiltonianPreservable && (safeMoves <= 1 || risk.score >= 85);
  const strategy = selectStrategy(previousStrategy, { emergency: emergencyOutsideHamiltonian, allRisky: legal.length > 0 && viable.length === 0, safeMoves, riskScore: risk.score, highOccupancy, hamiltonianAvailable, hamiltonianPreservable, foodSafe, tailPreferred, expanding: bestArea > 0.65, recovered: previousStrategy.mode === 'escape' && risk.score < 35 }, config.strategyMinDwellTicks);
  return { direction: best?.direction ?? null, strategy, risk, evaluations, summary: summaryFor(strategy, risk, best, rejectedFood), nodesEvaluated, budgetExhausted };
}
