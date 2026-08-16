import { z } from 'zod';

const Vec2Schema = z.object({ x: z.number().int(), y: z.number().int() }).strict();
const DirectionSchema = z.enum(['up', 'right', 'down', 'left']);
const GeometryPatternSchema = z.enum(['wall', 'corridors', 'crossroads', 'islands', 'maze', 'labyrinth', 'ring', 'seeded-grid']);

const StaticObstacleSchema = z.object({ id: z.string().min(1), kind: z.literal('static'), cells: z.array(Vec2Schema).min(1) }).strict();
const GeometryObstacleSchema = z.object({ id: z.string().min(1), kind: z.literal('geometry'), pattern: GeometryPatternSchema, density: z.number().min(0).max(1).optional() }).strict();
const MovingObstacleSchema = z.object({ id: z.string().min(1), kind: z.literal('moving'), path: z.array(Vec2Schema).min(2), periodTicks: z.number().int().positive() }).strict();
const ObstacleSchema = z.discriminatedUnion('kind', [StaticObstacleSchema, GeometryObstacleSchema, MovingObstacleSchema]);

const StaticHazardSchema = z.object({ id: z.string().min(1), kind: z.literal('static'), cells: z.array(Vec2Schema).min(1) }).strict();
const MovingHazardSchema = z.object({ id: z.string().min(1), kind: z.literal('moving'), path: z.array(Vec2Schema).min(2), periodTicks: z.number().int().positive() }).strict();
const HazardSchema = z.discriminatedUnion('kind', [StaticHazardSchema, MovingHazardSchema]);

const PortalSchema = z.object({ id: z.string().min(1), a: Vec2Schema, b: Vec2Schema }).strict();

const FoodTypeSchema = z.object({
  id: z.string().min(1),
  weight: z.number().positive(),
  value: z.number().finite(),
  growthDelta: z.number().int(),
  scoreDelta: z.number().finite(),
}).strict();

const FoodRulesSchema = z.object({
  types: z.array(FoodTypeSchema).min(1),
  maxActive: z.number().int().positive().max(16),
  spawnEveryTicks: z.number().int().positive(),
  initialCount: z.number().int().nonnegative().max(16),
}).strict();

const GoalSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('length'), target: z.number().int().positive() }).strict(),
  z.object({ type: z.literal('food'), target: z.number().int().nonnegative() }).strict(),
  z.object({ type: z.literal('survival-ticks'), target: z.number().int().positive() }).strict(),
  z.object({ type: z.literal('occupancy-percent'), target: z.number().positive().max(100) }).strict(),
  z.object({ type: z.literal('score'), target: z.number().finite() }).strict(),
  z.object({ type: z.literal('mechanic-objective'), key: z.string().min(1), target: z.number().finite() }).strict(),
]);

const MechanicSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('shrinking-bounds'), everyTicks: z.number().int().positive(), inset: z.number().int().positive(), minWidth: z.number().int().min(3), minHeight: z.number().int().min(3) }).strict(),
  z.object({ kind: z.literal('chaos-grid'), everyTicks: z.number().int().positive(), density: z.number().min(0).max(0.4) }).strict(),
  z.object({ kind: z.literal('food-cadence'), everyTicks: z.number().int().positive() }).strict(),
  z.object({ kind: z.literal('speed-pressure'), multiplier: z.number().positive().max(8) }).strict(),
]);

export const LevelDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  number: z.number().int().min(1),
  version: z.number().int().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  board: z.object({ width: z.number().int().min(4).max(200), height: z.number().int().min(4).max(200), wrap: z.boolean().default(false) }).strict(),
  snake: z.object({ initialLength: z.number().int().min(2), direction: DirectionSchema, head: Vec2Schema }).strict(),
  timing: z.object({ ticksPerSecond: z.number().positive().max(120) }).strict(),
  obstacles: z.array(ObstacleSchema).default([]),
  hazards: z.array(HazardSchema).default([]),
  portals: z.array(PortalSchema).default([]),
  food: FoodRulesSchema,
  progression: z.object({ mode: z.enum(['all', 'any']), goals: z.array(GoalSchema).min(1) }).strict(),
  completion: z.object({ onGoalsMet: z.literal('level-complete') }).strict(),
  difficultyMultiplier: z.number().positive().max(20),
  ai: z.object({ lookaheadDepth: z.number().int().min(1).max(12), lookaheadNodeBudget: z.number().int().min(8).max(200000), strategyMinDwellTicks: z.number().int().min(1).max(100) }).strict(),
  theme: z.object({ id: z.string().min(1), music: z.string().min(1), palette: z.string().min(1) }).strict(),
  mechanics: z.array(MechanicSchema).default([]),
}).strict();

export type LevelDefinition = z.infer<typeof LevelDefinitionSchema>;
export type LevelGoal = LevelDefinition['progression']['goals'][number];
export type LevelObstacle = LevelDefinition['obstacles'][number];
export type LevelHazard = LevelDefinition['hazards'][number];
export type LevelMechanic = LevelDefinition['mechanics'][number];

export function parseLevelDefinition(input: unknown): LevelDefinition {
  return LevelDefinitionSchema.parse(input);
}
