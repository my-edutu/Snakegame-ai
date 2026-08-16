# Canonical Game State Model

## Principle
There is exactly one authoritative simulation state. UI, renderer, analytics, and persistence receive projections or immutable snapshots.

## Core types
```ts
type RunId = string;
type LevelId = string;
type Tick = number;

type Vec2 = Readonly<{ x: number; y: number }>;

type Direction = 'up' | 'down' | 'left' | 'right';

type LifecycleState =
  | 'boot'
  | 'intro'
  | 'new-game'
  | 'level-start'
  | 'playing'
  | 'level-complete'
  | 'death'
  | 'run-summary'
  | 'countdown'
  | 'paused';
```

## `GameState`
```ts
interface GameState {
  readonly schemaVersion: number;
  readonly runId: RunId;
  readonly seed: number;
  readonly tick: Tick;
  readonly lifecycle: LifecycleState;
  readonly level: LevelRuntimeState;
  readonly snake: SnakeState;
  readonly food: readonly FoodEntity[];
  readonly obstacles: readonly ObstacleEntity[];
  readonly hazards: readonly HazardEntity[];
  readonly score: ScoreState;
  readonly progression: ProgressionState;
  readonly ai: AIState;
  readonly risk: RiskState;
  readonly run: RunStats;
  readonly rng: SerializedRngState;
  readonly lastDeath?: DeathRecord;
}
```

## Snake state
Store body coordinates in head-first order or an optimized ring/deque abstraction that serializes to deterministic coordinates. Do not represent the snake as renderer sprites in the domain.

```ts
interface SnakeState {
  readonly body: readonly Vec2[];
  readonly direction: Direction;
  readonly pendingGrowth: number;
  readonly alive: boolean;
}
```

## AI state
```ts
interface AIState {
  readonly strategy: StrategyId;
  readonly previousStrategy?: StrategyId;
  readonly decisionSequence: number;
  readonly lastDecision?: DecisionSummary;
  readonly currentPlan?: PlanSummary;
}
```

## Risk state
Risk is derived from evidence, not random UI decoration.
```ts
interface RiskState {
  readonly score: number; // clamped 0..100
  readonly band: 'low' | 'moderate' | 'high' | 'critical';
  readonly safeMoveCount: number;
  readonly accessibleTiles: number;
  readonly escapeRoutes: number;
  readonly projectedTrapProbability: number;
  readonly contributors: readonly RiskContributor[];
}
```

## Commands
The runtime accepts typed commands:
- `StartNewGame`
- `RestartLevel`
- `Pause`
- `Resume`
- `SkipLevel`
- `GoToLevel`
- `SetSimulationSpeed`
- `ApplyOperatorConfig`

Destructive record resets belong to persistence/application services, not the simulation reducer.

## Tick order
Each deterministic tick should have a documented fixed order:
1. apply accepted command boundary changes
2. update deterministic level mechanics/hazards
3. build AI observation
4. generate/rank legal candidate moves
5. optionally apply failure-engine deviation
6. move snake
7. resolve food/hazard/collision effects
8. update score/progression/risk
9. evaluate level completion/death
10. emit domain events
11. advance tick and RNG state

Changing tick order is a breaking simulation behavior change and requires replay tests.

## Snapshots and checkpoints
A checkpoint must contain enough state to resume deterministically, including RNG state, level runtime state, timers measured in ticks, snake body, food/hazards, run stats, and active configuration versions.

Wall-clock timestamps may be stored for display/analytics, but simulation truth must not depend on wall-clock timing.
