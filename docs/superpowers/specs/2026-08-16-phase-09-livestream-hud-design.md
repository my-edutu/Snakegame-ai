# Phase 9 Livestream HUD — Design

## Goal
Build a production-grade spectator HUD for Autonomous AI Snake that makes the run understandable within five seconds, remains readable after livestream compression at 1080p/1440p/4K, and displays only evidence derived from authoritative simulation, AI, lifecycle, milestone, near-death, and record state.

## Chosen approach
Use a Pixi-native HUD rendered inside the existing Phase 8 canvas. Keep all HUD state derivation pure and presentation-only. This is preferred over a DOM overlay because it gives a single OBS capture surface, deterministic layout scaling, synchronized event animation, simpler fullscreen behavior, and avoids browser/CSS divergence between stream resolutions.

Alternatives rejected:
- DOM overlay: easier text styling, but weaker for OBS capture consistency and synchronized canvas effects.
- Hybrid DOM/Pixi: flexible, but creates two layout/render systems and unnecessary Phase 9 complexity.

## Architecture
Extend `@snake/renderer` with a HUD subsystem rather than introducing a second Pixi-owning package.

Pure layer:
- `hud-types.ts` — spectator snapshot, strategy evidence, record targets, milestone state, run summary, countdown, and secondary statistics.
- `hud-model.ts` — validates and projects authoritative public inputs into a detached immutable HUD model.
- `hud-copy.ts` — evidence-backed AI/public copy only; no invented dramatic claims.
- `hud-layout.ts` — resolution-independent layout metrics and typography scales for 1080p, 1440p, and 4K.
- `hud-events.ts` — event priority, cooldown, dedupe, and restrained banner state.

Pixi layer:
- `draw-hud.ts` — persistent HUD containers/text/graphics with bounded reuse.
- `draw-hud-events.ts` — milestone, record, close-call, critical-risk, level-complete, run-summary, and restart-countdown treatments.
- Existing renderer lifecycle owns HUD creation, updates, resize, quality changes, and teardown.

## HUD contract
The HUD snapshot contains:

Always visible:
- level number and level name;
- snake length;
- occupancy percent;
- AI strategy label;
- risk score and risk band;
- run duration;
- next milestone or current record target.

Secondary:
- score;
- food eaten;
- safe move count;
- projected/lookahead move count when evidence exists;
- run number;
- best occupancy;
- highest level;
- deaths;
- total games;
- current level streak.

Lifecycle presentation:
- level-start title treatment;
- playing HUD;
- level-complete treatment;
- death state;
- run summary;
- automatic restart countdown;
- paused state treatment.

## Evidence-backed AI copy
Public strategy strings must be generated from structured evidence. Supported examples include:
- `SPACE PRESERVATION`;
- `FOOD PATH REJECTED — trap risk 68%`;
- `FOLLOWING TAIL — 3 escape routes preserved`;
- `ENDGAME MODE ACTIVATED`;
- `CRITICAL SURVIVAL — 1 safe move`.

If evidence is absent, show a neutral validated strategy label rather than generating a claim.

## Event policy
Use bounded priority and cooldown behavior. Events may be shown for:
- occupancy thresholds 25%, 50%, 75%, 90%, 95%;
- record markers from Phase 7;
- longest survival/new high score/max occupancy/max length/highest level;
- major level thresholds 5/10/15/20;
- one safe move remaining;
- verified near-death events;
- level completion and death.

Priority: record > critical survival/near-death > level completion > occupancy/level milestone > strategy change.

Repeated event ids are deduped. Lower-priority events wait or expire rather than visually stacking.

## Visual hierarchy
Use a safe-area composition around the gameplay board:
- top-left: level identity + run timer;
- top-center: strategy/status strip;
- top-right: risk meter;
- left/bottom: length, occupancy, score/food;
- right/bottom: next milestone/record target and compact historical stats;
- center overlays only for transient high-value events, summary, and countdown.

The board remains dominant. HUD chrome uses translucent panels, strong contrast, restrained glow, numeric tabular alignment, and no continuous attention-grabbing animation.

## Compression and resolution rules
- Layout computed from logical canvas dimensions, not browser CSS pixels.
- Minimum effective 1080p body text target: 24 px; important metrics 30–40 px; level/risk/event headings larger.
- Stroke/shadow/contrast selected for H.264/H.265 compression resilience.
- No thin one-pixel critical indicators.
- 1440p and 4K scale proportionally while preserving safe margins and hierarchy.
- Long level names/strategy messages clamp and ellipsize without overlapping the board.

## Error handling
- Reject NaN, negative impossible counters, invalid risk ranges, invalid lifecycle values, and malformed records in pure model construction.
- Clamp presentation-only percentages to display-safe ranges only after validation where appropriate.
- Missing optional evidence degrades to neutral copy.
- Renderer must not crash because a secondary HUD metric is unavailable; required fields remain validated.

## Performance and resource rules
- No per-frame text/container allocation after warm-up.
- Reuse Pixi text/graphics objects.
- Event queue is hard bounded.
- Layout objects are recomputed only on resolution/viewport changes.
- HUD updates never influence simulation tick, AI choice, failure policy, progression, or records.

## Accessibility
- Risk is encoded with text and numeric score, not color alone.
- Critical events have shape/text differentiation.
- Reduced-motion HUD mode follows quality/accessibility settings where available.
- High-contrast text and safe sizing at the 1080p baseline.

## Verification
Unit tests:
- HUD model immutability and validation;
- AI-copy evidence mapping;
- milestone/record target selection;
- event dedupe/priority/cooldowns;
- timer/countdown formatting;
- layout bounds at 1080p/1440p/4K.

Integration tests:
- renderer creates exactly one HUD root;
- repeated updates reuse objects;
- lifecycle transitions show correct panels;
- destroy/re-init returns HUD resources to baseline;
- unknown optional evidence degrades safely.

Browser/visual gates:
- production preview starts in Chrome;
- screenshots at 1080p/1440p/4K;
- DOM/canvas readiness and exact canvas dimensions;
- screenshot reference for playing, critical-risk, record, run-summary, and countdown states;
- no clipping or overlap in safe-area assertions.

Soak gate:
- at least 50,000 HUD updates with bounded object/event counts and no unbounded metric growth.

## Exit criteria
Phase 9 is complete only when:
1. all always-visible and secondary metrics are supported by the public HUD contract;
2. all dramatic copy is traceable to structured evidence;
3. lifecycle summary/countdown states are implemented;
4. event dedupe/cooldown/priority rules are tested;
5. 1080p/1440p/4K layout and Chrome visual smoke pass;
6. the full inherited deterministic CI suite remains green;
7. Phase 9 is squash-merged and the resulting `main` commit passes the permanent workflow independently.
