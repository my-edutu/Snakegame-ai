import type { AiObservation } from './observation.js';
import { findPathAStar } from './astar.js';
import { findPathBfs } from './bfs.js';
import { planPathToFood, planPathToTail } from './planners.js';
import { rankCandidateMoves } from './candidates.js';

const observation: AiObservation = {
  board: { width: 20, height: 12 },
  head: { x: 4, y: 5 },
  tail: { x: 1, y: 5 },
  body: [
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
    { x: 1, y: 5 },
  ],
  direction: 'right',
  pendingGrowth: 0,
  growthPerFood: 1,
  food: [{ id: 'food-demo', type: 'normal', value: 1, position: { x: 15, y: 8 } }],
  obstacles: [
    { id: 'wall-a', position: { x: 8, y: 5 } },
    { id: 'wall-b', position: { x: 8, y: 6 } },
    { id: 'wall-c', position: { x: 8, y: 7 } },
  ],
  hazards: [],
  portals: [],
  wrap: false,
  tick: 120,
  runId: 'phase-02-smoke',
};

const target = observation.food[0]!.position;
const bfs = findPathBfs(observation, observation.head, target);
const astar = findPathAStar(observation, observation.head, target);
const food = planPathToFood(observation);
const tail = planPathToTail(observation);
const candidates = rankCandidateMoves(observation, target);

console.log(JSON.stringify({
  bfs: {
    outcome: bfs.telemetry.outcome,
    pathLength: bfs.telemetry.pathLength,
    nodesExplored: bfs.telemetry.nodesExplored,
    directions: bfs.route?.directions ?? [],
  },
  astar: {
    outcome: astar.telemetry.outcome,
    pathLength: astar.telemetry.pathLength,
    nodesExplored: astar.telemetry.nodesExplored,
    directions: astar.route?.directions ?? [],
  },
  food: {
    targetId: food.target?.id ?? null,
    pathLength: food.search?.telemetry.pathLength ?? null,
  },
  tail: {
    outcome: tail.search.telemetry.outcome,
    pathLength: tail.search.telemetry.pathLength,
  },
  candidates: candidates.map(({ direction, legal, staticTargetDistance }) => ({
    direction,
    legal,
    staticTargetDistance,
  })),
}));
