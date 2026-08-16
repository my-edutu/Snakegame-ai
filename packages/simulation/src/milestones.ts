export interface MilestoneEvent { readonly type: 'milestone'; readonly key: string; readonly tick: number; readonly value: number; readonly threshold: number }
export interface MilestoneState { readonly emittedKeys: readonly string[]; readonly lastEventTick: number | null }
export interface MilestoneInput { readonly tick: number; readonly length: number; readonly occupancyPercent: number; readonly foodConsumed: number; readonly score: number; readonly level: number; readonly levelStreak: number; readonly ticksSurvived: number }
export interface MilestoneOptions { readonly minimumGapTicks: number }

const groups: readonly [keyof Omit<MilestoneInput, 'tick'>, string, readonly number[]][] = [
  ['length', 'length', [10,25,50,100]], ['occupancyPercent','occupancy',[25,50,75,90,95]], ['foodConsumed','food',[10,25,50,100]],
  ['score','score',[100,500,1000,5000]], ['level','level',[5,10,15,20]], ['levelStreak','streak',[3,5,10,20]], ['ticksSurvived','survival',[100,500,1000,5000]],
];
export const createMilestoneState = (): MilestoneState => ({ emittedKeys: [], lastEventTick: null });

export function evaluateMilestones(state: MilestoneState, input: MilestoneInput, options: MilestoneOptions): { readonly state: MilestoneState; readonly events: readonly MilestoneEvent[] } {
  if (!Number.isInteger(options.minimumGapTicks) || options.minimumGapTicks < 0) throw new RangeError('minimumGapTicks must be a nonnegative integer.');
  const emitted = new Set(state.emittedKeys);
  const eligible: MilestoneEvent[] = [];
  for (const [field, prefix, thresholds] of groups) for (const threshold of thresholds) {
    const key = `${prefix}-${threshold}`;
    const value = input[field];
    if (value >= threshold && !emitted.has(key)) eligible.push({ type: 'milestone', key, tick: input.tick, value, threshold });
  }
  if (eligible.length === 0) return { state: { emittedKeys: [...state.emittedKeys], lastEventTick: state.lastEventTick }, events: [] };
  const gapOpen = state.lastEventTick === null || input.tick - state.lastEventTick >= options.minimumGapTicks;
  if (!gapOpen) return { state: { emittedKeys: [...state.emittedKeys], lastEventTick: state.lastEventTick }, events: [] };
  const events = options.minimumGapTicks === 0 ? eligible : [eligible[0]!];
  for (const event of events) emitted.add(event.key);
  return { state: { emittedKeys: [...emitted], lastEventTick: input.tick }, events };
}
