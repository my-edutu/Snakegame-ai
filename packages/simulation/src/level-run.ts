import { createObservation, decideSurvivalMove, type StrategyState, type SurvivalDecision } from '@snake/ai';
import { createEngine, type EngineConfig, type EngineFoodConfig, type GameState } from '@snake/engine';
import type { Direction } from '@snake/shared';
import { compileLevel, evaluateProgression, mixSeed, resolveMechanics, type LevelDefinition, type ProgressionEvaluation } from '@snake/levels';
import type { SimulationHarnessConfig, SimulationRunResult, SimulationTerminalReason, StrategyTransition, TerminalDecisionContext } from './types.js';

export interface LevelSimulationResult {
  readonly levelId: string;
  readonly levelNumber: number;
  readonly levelVersion: number;
  readonly levelCompleted: boolean;
  readonly progression: ProgressionEvaluation;
  readonly run: SimulationRunResult;
}

export interface LevelDecisionPolicyContext {
  readonly level: LevelDefinition;
  readonly seed: number;
  readonly state: GameState;
  readonly decision: SurvivalDecision;
  readonly decisionSequence: number;
}
export type LevelDecisionPolicy = (context: LevelDecisionPolicyContext) => Direction | null;

const initialStrategy = (): StrategyState => ({ mode: 'explore', ticksInMode: 10_000 });
const emptyTerminalContext = (): TerminalDecisionContext => ({ strategy: null, riskLevel: null, riskScore: 0, safeMoves: 0, summary: null });
const key = (cell: Readonly<{ x: number; y: number }>): string => `${cell.x},${cell.y}`;

function spawnDueFood(level: LevelDefinition, seed: number, tick: number, state: ReturnType<ReturnType<typeof createEngine>['getState']>): readonly EngineFoodConfig[] {
  if (state.food.length >= level.food.maxActive) return state.food.map((food) => ({ id: food.id, type: food.type, position: { ...food.position }, value: food.value, ...(food.growthDelta === undefined ? {} : { growthDelta: food.growthDelta }), ...(food.scoreDelta === undefined ? {} : { scoreDelta: food.scoreDelta }) }));
  const blocked = new Set([...state.snake.body, ...state.obstacles.map((item) => item.position), ...state.hazards.map((item) => item.position), ...state.portals.flatMap((portal) => [portal.a, portal.b])].map(key));
  const free: { x: number; y: number }[] = [];
  for (let y = 0; y < state.level.height; y += 1) for (let x = 0; x < state.level.width; x += 1) if (!blocked.has(`${x},${y}`) && !state.food.some((food) => food.position.x === x && food.position.y === y)) free.push({ x, y });
  if (free.length === 0) return state.food as readonly EngineFoodConfig[];
  const position = free[mixSeed(seed, tick, state.food.length) % free.length]!;
  const totalWeight = level.food.types.reduce((sum, type) => sum + type.weight, 0);
  let cursor = (mixSeed(seed, tick, 0xf00d) / 0xffffffff) * totalWeight;
  let chosen = level.food.types[0]!;
  for (const type of level.food.types) { chosen = type; cursor -= type.weight; if (cursor <= 0) break; }
  return [...state.food.map((food) => ({ id: food.id, type: food.type, position: { ...food.position }, value: food.value, ...(food.growthDelta === undefined ? {} : { growthDelta: food.growthDelta }), ...(food.scoreDelta === undefined ? {} : { scoreDelta: food.scoreDelta }) })), { id: `${level.id}-food-${tick}-${state.food.length}`, type: chosen.id, position, value: chosen.value, growthDelta: chosen.growthDelta, scoreDelta: chosen.scoreDelta }];
}

export function runLevelSimulationWithPolicy(level: LevelDefinition, seed: number, harness: SimulationHarnessConfig, policy?: LevelDecisionPolicy): LevelSimulationResult {
  if (!Number.isInteger(harness.maxTicks) || harness.maxTicks < 1) throw new RangeError('maxTicks must be a positive integer.');
  const compiled = compileLevel(level, seed);
  const engine = createEngine(compiled.engine as EngineConfig);
  let strategy = initialStrategy();
  const strategyTicks: Record<string, number> = {};
  const transitions: StrategyTransition[] = [];
  let riskSum = 0, peakRisk = 0, totalDecisionNodes = 0, peakDecisionNodes = 0, decisionCount = 0, nearDeathCount = 0, hamiltonianEntries = 0, hamiltonianTicks = 0;
  let terminalReason: SimulationTerminalReason = 'simulation-cap';
  let terminalContext = emptyTerminalContext();
  let progression = evaluateProgression(level, { length: engine.getState().snake.body.length, foodEaten: 0, ticksSurvived: 0, occupancyPercent: engine.getState().progression.occupancyPercent, score: 0 });

  for (let index = 0; index < harness.maxTicks; index += 1) {
    const beforeFrame = engine.getState();
    const frame = resolveMechanics(level, seed, beforeFrame.tick);
    const movingIds = new Set(level.obstacles.filter((item) => item.kind === 'moving').map((item) => item.id));
    const staticObstacles = compiled.engine.obstacles.filter((item) => ![...movingIds].some((id) => item.id.startsWith(`${id}-`)));
    const movingHazardIds = new Set(level.hazards.filter((item) => item.kind === 'moving').map((item) => item.id));
    const staticHazards = compiled.engine.hazards.filter((item) => ![...movingHazardIds].some((id) => item.id.startsWith(`${id}-`)));
    engine.applyEnvironment({
      obstacles: [...staticObstacles, ...frame.movingObstacles, ...frame.chaosCells.map((position, i) => ({ id: `chaos-${i}`, position }))],
      hazards: [...staticHazards, ...frame.movingHazards], activeBounds: frame.activeBounds,
    });
    if (frame.foodSpawnDue) engine.applyEnvironment({ food: spawnDueFood(level, seed, beforeFrame.tick, engine.getState()) });

    const before = engine.getState();
    if (!before.snake.alive || before.lifecycle === 'death') { terminalReason = 'death'; break; }
    const decision = decideSurvivalMove(createObservation(before), strategy, compiled.ai);
    terminalContext = { strategy: decision.strategy.mode, riskLevel: decision.risk.level, riskScore: decision.risk.score, safeMoves: decision.risk.contributors.safeMoves, summary: decision.summary };
    decisionCount += 1; riskSum += decision.risk.score; peakRisk = Math.max(peakRisk, decision.risk.score); totalDecisionNodes += decision.nodesEvaluated; peakDecisionNodes = Math.max(peakDecisionNodes, decision.nodesEvaluated);
    if (decision.risk.contributors.safeMoves <= 1) nearDeathCount += 1;
    if (decision.strategy.mode !== strategy.mode) { transitions.push({ from: strategy.mode, to: decision.strategy.mode, tick: before.tick }); if (decision.strategy.mode === 'hamiltonian') hamiltonianEntries += 1; }
    strategy = decision.strategy; strategyTicks[strategy.mode] = (strategyTicks[strategy.mode] ?? 0) + 1; if (strategy.mode === 'hamiltonian') hamiltonianTicks += 1;
    const selectedDirection = policy ? policy({ level, seed, state: before, decision, decisionSequence: before.ai.decisionSequence }) : decision.direction;
    if (!selectedDirection) { terminalReason = 'no-move'; break; }
    engine.step(selectedDirection);
    const after = engine.getState();
    progression = evaluateProgression(level, { length: after.snake.body.length, foodEaten: after.score.foodEaten, ticksSurvived: after.run.ticksSurvived, occupancyPercent: after.progression.occupancyPercent, score: after.score.score });
    if (progression.complete) break;
    if (!after.snake.alive || after.lifecycle === 'death') { terminalReason = 'death'; break; }
    if (after.progression.boardFilled) { terminalReason = 'board-filled'; break; }
  }

  const state = engine.getState();
  const run: SimulationRunResult = {
    seed: seed >>> 0, terminalReason, deathCause: state.lastDeath?.cause ?? null, ticksSurvived: state.run.ticksSurvived,
    maxLength: state.run.maxLength, maxOccupancyPercent: state.run.maxOccupancyPercent, score: state.score.score, foodConsumed: state.score.foodEaten,
    strategyTicks, strategyTransitions: transitions, averageRisk: decisionCount === 0 ? 0 : riskSum / decisionCount, peakRisk, totalDecisionNodes,
    averageDecisionNodes: decisionCount === 0 ? 0 : totalDecisionNodes / decisionCount, peakDecisionNodes, nearDeathCount, hamiltonianEntries, hamiltonianTicks,
    terminalContext, levelReached: 1, levelCompleted: progression.complete,
  };
  return { levelId: level.id, levelNumber: level.number, levelVersion: level.version, levelCompleted: progression.complete, progression, run };
}

export function runLevelSimulation(level: LevelDefinition, seed: number, harness: SimulationHarnessConfig): LevelSimulationResult {
  return runLevelSimulationWithPolicy(level, seed, harness);
}
