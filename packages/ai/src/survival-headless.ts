import { decideSurvivalMove } from './decision.js';
import type { AiObservation } from './observation.js';

const observation: AiObservation = {
  board: { width: 12, height: 8 },
  head: { x: 4, y: 4 },
  tail: { x: 1, y: 4 },
  body: [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }],
  direction: 'right',
  pendingGrowth: 0,
  growthPerFood: 1,
  food: [{ id: 'food-demo', type: 'normal', value: 1, position: { x: 9, y: 4 } }],
  obstacles: [
    { id: 'wall-a', position: { x: 7, y: 3 } },
    { id: 'wall-b', position: { x: 7, y: 4 } },
    { id: 'wall-c', position: { x: 7, y: 5 } },
  ],
  hazards: [],
  portals: [],
  wrap: false,
  tick: 240,
  runId: 'phase-03-smoke',
};

const decision = decideSurvivalMove(observation, { mode: 'explore', ticksInMode: 10 });
console.log(JSON.stringify({
  direction: decision.direction,
  strategy: decision.strategy,
  risk: decision.risk,
  summary: decision.summary,
  nodesEvaluated: decision.nodesEvaluated,
  budgetExhausted: decision.budgetExhausted,
  evaluations: decision.evaluations.map(({ direction, legal, hardRejected, reachableAreaRatio, tailReachable, escapeRouteCount, predictedSurvivalTicks, hamiltonianPenalty, trapProbability, totalScore, reasons }) => ({
    direction, legal, hardRejected, reachableAreaRatio, tailReachable, escapeRouteCount, predictedSurvivalTicks, hamiltonianPenalty, trapProbability, totalScore, reasons,
  })),
}));
