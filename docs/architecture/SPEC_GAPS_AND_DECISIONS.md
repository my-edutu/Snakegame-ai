# Specification Gaps and Recommended Decisions

The master prompt is strong, but several implementation decisions should be explicit before production code grows around accidental assumptions.

## 1. Board size envelope
Define supported minimum/maximum board dimensions and target maximum snake length. Recommendation: make bounds configuration-driven but establish tested production envelopes early so data structures and renderer scaling can be chosen deliberately.

## 2. Tick semantics versus visual speed
Clarify that gameplay timing is fixed-tick and deterministic while rendering interpolates independently. Simulation-speed controls should scale tick execution, not alter rule ordering.

## 3. Occupancy definition
Decide whether occupancy denominator excludes static obstacles and permanently unplayable geometry. Recommendation: expose both `boardOccupancy` and `playableOccupancy`, while using playable occupancy for progression on irregular boards.

## 4. Level completion after death on same tick
Specify event precedence when a move simultaneously satisfies a goal and causes death. Recommendation: collision/death resolution takes precedence unless a level explicitly defines otherwise.

## 5. Multiple food semantics
Define growth, score, TTL, spawn weighting, exclusivity, and effects for Rare/Epic/Bonus/Speed/Multiplier/Mystery food. Effects must be deterministic and simulation-tick based.

## 6. Hazard interaction contract
Moving hazards need explicit ordering: hazard moves before AI decision or after snake movement. Recommendation: use the canonical tick order in `GAME_STATE_MODEL.md` and keep it stable.

## 7. Portal rules
Specify whether entering a portal consumes a move, exit direction preservation, collision at exit, and whether portals can chain. Recommendation: one deterministic teleport per move, preserve direction, validate exit occupancy, prohibit immediate recursive chaining unless level configuration opts in.

## 8. Hamiltonian applicability
Not every level geometry supports a full Hamiltonian cycle. The system should expose compatibility/cycle metadata and allow near-Hamiltonian/endgame policies rather than promising universal cycles.

## 9. Controlled-failure causal labeling
A configured deviation may occur long before an unrelated natural death. Use causal attribution windows/evidence instead of labeling the entire run artificial after one deviation.

## 10. Stream/operator security boundary
If deployed publicly, `/operator` cannot rely on obscurity. V1 local-only use is acceptable, but hosted deployment should add authentication and prevent private config from entering public serialized state.

## 11. Save/checkpoint cadence
Define checkpoint triggers and storage limits. Recommendation: periodic tick interval plus major lifecycle events, with bounded historical checkpoints and durable all-time aggregates.

## 12. Analytics retention
Per-decision logs can grow enormous over days. Keep detailed logs in bounded rolling buffers and aggregate older data. Persist only meaningful decisions/events by default.

## 13. Browser crash watchdog
A web page cannot guarantee recovery from every browser/OS failure. Build watchdog-ready health signals and document an external process/OBS/browser restart strategy for true unattended production.

## 14. Mobile scope
The specification requires mobile usability but livestream capture is desktop-first. Treat mobile as an operator/preview compatibility target, not a requirement to match the full 4K stream composition on a phone.

## 15. Asset licensing
Establish a repository policy for fonts, textures, sounds, music, logos, and sponsor assets. Do not package copyrighted music without appropriate rights.

## 16. Branding defaults
The prompt describes configurable branding but does not name final default title/logo/tagline. Keep defaults generic until brand assets are explicitly supplied.

## 17. Deployment target
Choose whether v1 is static/edge hosted or uses a Node runtime. The deterministic game does not need a server to function, so deployment should minimize backend dependency until remote records/chat integrations are added.

## 18. Future viewer integrations
Define an event gateway now, not YouTube/Twitch code. Example inputs: `ViewerVoteReceived`, `CosmeticTriggerRequested`, `LevelVoteClosed`. Platform adapters can translate external APIs into these events later.

## 19. Anti-abuse and monetization boundaries
Future donation/chat features should affect cosmetics or clearly documented gameplay events and comply with platform policies. Do not implement fake engagement, fabricated donations, or artificial traffic.

## 20. Record integrity
Decide whether records produced under configured failure presets share the same leaderboard as Record Attempt. Recommendation: tag records by run profile and expose an overall record plus `record-attempt` records to preserve interpretability.

## Recommended immediate decision set
Proceed with:
- Next.js + PixiJS + strict TypeScript
- deterministic fixed-tick engine
- seeded PRNG everywhere gameplay randomness exists
- IndexedDB first, repository abstraction for Supabase later
- separate `/stream`, `/operator`, `/debug`
- playable-area occupancy as the principal irregular-level metric
- hybrid deterministic search AI rather than opaque ML for v1
- bounded detailed telemetry plus durable aggregates
- profile-tagged records
- external-watchdog-ready health architecture for unattended streaming
