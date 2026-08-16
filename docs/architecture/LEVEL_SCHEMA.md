# Level Configuration Schema

## Goal
Levels are declarative, validated, versioned configurations. Adding level 21 or level 50 should not require modifying core movement code.

## Proposed schema
```ts
interface LevelDefinition {
  id: string;
  version: number;
  name: string;
  description: string;
  board: {
    width: number;
    height: number;
    wrap: boolean;
    geometry?: GeometryDescriptor;
  };
  snake: {
    initialLength: number;
    initialDirection: Direction;
    spawn: SpawnDescriptor;
  };
  timing: {
    ticksPerSecond: number;
    speedCurve?: SpeedCurve;
  };
  obstacles: readonly ObstacleDescriptor[];
  hazards: readonly HazardDescriptor[];
  food: FoodRules;
  goals: readonly ProgressionGoal[];
  completionPolicy: 'advance' | 'celebrate-then-advance' | 'pause' | 'operator-confirm';
  difficultyMultiplier: number;
  aiModifiers: AIModifiers;
  theme: ThemeRef;
  milestoneOverrides?: MilestoneRules;
}
```

## Supported progression goals
- reach snake length
- consume food count
- survive ticks/time
- reach occupancy percentage
- reach score
- complete level-specific objective

Goals may use `all` or `any` aggregation where appropriate.

## First 20 strategic levels
1. **Genesis** — open board; baseline navigation and growth.
2. **Growing Pressure** — reduced effective area and faster occupancy growth.
3. **The Wall** — static wall segments force route planning.
4. **Corridors** — narrow lanes punish greedy food pursuit.
5. **Crossroads** — chambers connected by bottlenecks.
6. **Velocity** — increased tick rate and tighter decision budget.
7. **Islands** — obstacle clusters create irregular regions.
8. **The Maze** — maze topology tests long-horizon route safety.
9. **Moving Walls** — deterministic periodic obstacle motion.
10. **Famine** — sparse/slow food spawning; survival goal emphasized.
11. **Hunter** — deterministic moving hazards traverse the map.
12. **Portals** — paired teleport tiles alter graph connectivity.
13. **Dual Feast** — simultaneous foods with different values/risks.
14. **Poison Garden** — harmful food or temporary topology penalties.
15. **Shrinking Arena** — playable boundary contracts according to tick schedule.
16. **Chaos Grid** — obstacles reconfigure from seeded schedules.
17. **Hyper Speed** — extreme speed with constrained reasoning budget.
18. **Labyrinth** — complex maze with few escape routes and deep chambers.
19. **Endgame** — large starting snake; immediate space-management pressure.
20. **Singularity** — extreme occupancy challenge designed for endgame/Hamiltonian behavior.

## Level-specific mechanics contract
A special mechanic implements deterministic hooks such as:
```ts
interface LevelMechanic {
  onLevelStart(ctx: MechanicContext): MechanicResult;
  beforeDecision(ctx: MechanicContext): MechanicResult;
  afterMove(ctx: MechanicContext): MechanicResult;
  onTickEnd(ctx: MechanicContext): MechanicResult;
}
```

Mechanics cannot read wall-clock time or use unseeded randomness.

## Validation invariants
A level is invalid if:
- board dimensions are outside supported limits
- spawn intersects obstacles/hazards
- initial snake does not fit
- goals are impossible by static validation where detectable
- portal pairs are incomplete
- movement schedules leave illegal coordinates
- theme/skin references are missing
- AI modifiers exceed safe bounds

## Future scale
Use a registry and schema migration mechanism. Keep visual metadata references separate from the engine-level geometry so headless simulations do not need rendering assets.
