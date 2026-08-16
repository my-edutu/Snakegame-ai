# Phase 9 Livestream HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-grade, Pixi-native livestream HUD that presents authoritative run state, AI evidence, risk, records, milestones, summaries, and restart countdowns clearly at 1080p/1440p/4K.

**Architecture:** Extend `@snake/renderer` with a pure immutable HUD snapshot/model layer plus persistent Pixi HUD drawables owned by `SnakeRenderer`. All public copy is generated from structured evidence, all event state is bounded/deduped, and HUD timing never feeds back into deterministic gameplay.

**Tech Stack:** TypeScript 5.8.x, PixiJS 8.19.0, Vitest 3.2.4, Vite 7.x preview host, pnpm 10.15.0, Node.js 22+.

## Global Constraints

- HUD is presentation-only and must never mutate or advance engine, AI, failure, progression, records, or lifecycle state.
- Dramatic copy must be traceable to structured evidence; absent evidence degrades to neutral copy.
- Exact target canvases: 1920×1080, 2560×1440, 3840×2160.
- Risk is represented numerically and textually, never color-only.
- Event queues, text objects, graphics objects, histories, and rolling metrics are hard-bounded.
- No per-frame Pixi container/text allocation after warm-up.
- The gameplay board remains visually dominant.
- Phase 9 does not implement operator controls, audio, persistence, or OBS orchestration.

---

### Task 1: Rich HUD Snapshot Contract and Validation

**Files:**
- Create: `packages/renderer/src/hud-types.ts`
- Create: `packages/renderer/src/hud-model.ts`
- Create: `packages/renderer/test/hud-model.test.ts`
- Modify: `packages/renderer/src/index.ts`

**Interfaces:**
- Produces `HudRiskBand = 'low' | 'guarded' | 'high' | 'critical'`.
- Produces `HudStrategyEvidence`, `HudRecordTarget`, `HudRunSummary`, `HudSnapshotInput`, `HudSnapshot`.
- Produces `createHudSnapshot(input: HudSnapshotInput): HudSnapshot`.

- [ ] **Step 1: Write RED tests for detached immutable snapshots**
  - Construct an input with level/run metrics, records, strategy evidence, lifecycle data, and record target.
  - Assert returned nested objects and arrays are detached from input.
  - Mutate source arrays after projection and assert snapshot does not change.

- [ ] **Step 2: Write RED validation tests**
  - Reject non-finite/negative score, length, food, safeMoves, projectedMoves, runNumber, deaths, totalGames, elapsedTicks.
  - Reject occupancy outside `[0,100]`, risk outside `[0,100]`, inconsistent `deaths > totalGames`, and malformed countdown values.
  - Require non-empty level and strategy labels.

- [ ] **Step 3: Run targeted tests and confirm RED**
  - `pnpm vitest run packages/renderer/test/hud-model.test.ts`
  - Expected: missing module/API failures only.

- [ ] **Step 4: Implement `hud-types.ts` and `createHudSnapshot`**
  - Use readonly interfaces and explicit clone/freeze helpers.
  - Keep module free of Pixi imports and browser APIs.

- [ ] **Step 5: Run targeted tests and confirm GREEN**

- [ ] **Step 6: Commit**
  - `feat(renderer): add livestream HUD snapshot contract`

---

### Task 2: Evidence-Backed AI Copy, Formatting, and Targets

**Files:**
- Create: `packages/renderer/src/hud-copy.ts`
- Create: `packages/renderer/test/hud-copy.test.ts`
- Modify: `packages/renderer/src/index.ts`

**Interfaces:**
- Produces `formatHudDuration(elapsedTicks, tickDurationMs): string`.
- Produces `formatCountdown(ticksRemaining, tickDurationMs): string`.
- Produces `derivePublicStrategyCopy(evidence: HudStrategyEvidence): string`.
- Produces `selectNextHudTarget(snapshot: HudSnapshot): HudRecordTarget | null`.

- [ ] **Step 1: Write RED formatting tests**
  - Verify zero, sub-minute, multi-minute, and hour duration formatting.
  - Verify countdown rounds up to the next visible second and never displays negative time.

- [ ] **Step 2: Write RED evidence-copy tests**
  - `space-preservation` -> `SPACE PRESERVATION`.
  - food rejection with trap risk 68 -> `FOOD PATH REJECTED — trap risk 68%`.
  - tail follow with three preserved escapes -> `FOLLOWING TAIL — 3 escape routes preserved`.
  - endgame flag -> `ENDGAME MODE ACTIVATED`.
  - critical one-safe-move evidence -> `CRITICAL SURVIVAL — 1 safe move`.
  - absent optional evidence yields neutral validated strategy label, never fabricated numbers.

- [ ] **Step 3: Write RED target-selection tests**
  - Prioritize nearest unachieved occupancy milestone before distant record values.
  - Prefer an active explicit record target over no milestone.
  - Return null only when no meaningful next target exists.

- [ ] **Step 4: Run targeted test and confirm RED**

- [ ] **Step 5: Implement copy/format/target helpers**
  - No random adjectives or free-form generation.

- [ ] **Step 6: Run targeted tests and confirm GREEN**

- [ ] **Step 7: Commit**
  - `feat(renderer): add evidence-backed HUD copy and targets`

---

### Task 3: HUD Event Priority, Dedupe, and Cooldowns

**Files:**
- Create: `packages/renderer/src/hud-events.ts`
- Create: `packages/renderer/test/hud-events.test.ts`
- Modify: `packages/renderer/src/index.ts`

**Interfaces:**
- Produces `HudEngagementEventKind` and `HudEngagementEvent`.
- Produces `HudEventQueue` with `push`, `active`, `advance`, `reset`, `destroy`, and `size`.
- Hard default capacity: 16 pending events.

- [ ] **Step 1: Write RED dedupe/capacity tests**
  - Repeated ids do not duplicate.
  - 10,000 pushes cannot exceed configured capacity.
  - Destroy/reset are idempotent.

- [ ] **Step 2: Write RED priority tests**
  - `record` > `critical-survival`/`near-death` > `level-complete` > `milestone` > `strategy-change`.
  - Higher-priority event can replace an active lower-priority event when explicitly configured interruptible.

- [ ] **Step 3: Write RED cooldown tests**
  - Repeated milestone/near-death categories inside cooldown do not show again.
  - Record events are never silently dropped due only to a milestone cooldown.

- [ ] **Step 4: Run targeted tests and confirm RED**

- [ ] **Step 5: Implement bounded queue and deterministic ordering**

- [ ] **Step 6: Run targeted tests and confirm GREEN**

- [ ] **Step 7: Commit**
  - `feat(renderer): add bounded HUD engagement events`

---

### Task 4: Resolution-Safe HUD Layout and Typography

**Files:**
- Create: `packages/renderer/src/hud-layout.ts`
- Create: `packages/renderer/test/hud-layout.test.ts`
- Modify: `packages/renderer/src/index.ts`

**Interfaces:**
- Produces `HudLayout`, `HudRect`, `HudTypography`.
- Produces `computeHudLayout(canvasWidth, canvasHeight, boardViewport): HudLayout`.

- [ ] **Step 1: Write RED tests for exact targets**
  - Verify 1920×1080, 2560×1440, 3840×2160 produce proportional typography and safe margins.
  - Assert 1080p body text >= 24 logical px and primary metric text >= 30 logical px.

- [ ] **Step 2: Write RED overlap/safe-area tests**
  - Top and side panels do not cover the computed board interior.
  - Center-event region remains inside canvas safe margins.
  - Long-copy bounds have explicit maximum widths.

- [ ] **Step 3: Write RED invalid-dimension tests**
  - Reject zero, negative, and non-finite canvas geometry.

- [ ] **Step 4: Implement pure layout calculation**
  - Scale from 1080p baseline and clamp to safe minimums.

- [ ] **Step 5: Run targeted tests and confirm GREEN**

- [ ] **Step 6: Commit**
  - `feat(renderer): add livestream HUD layout system`

---

### Task 5: Persistent Pixi HUD Drawables

**Files:**
- Create: `packages/renderer/src/draw-hud.ts`
- Create: `packages/renderer/src/draw-hud-events.ts`
- Create: `packages/renderer/test/hud-drawables.test.ts`
- Modify: `packages/renderer/src/scene.ts`

**Interfaces:**
- Produces `createHudDrawableManager(layers): HudDrawableManager`.
- Manager methods: `update(snapshot, layout, theme, quality)`, `updateEvent(event, layout, theme, quality)`, `hideEvent()`, `destroy()`, `getResourceCounts()`.

- [ ] **Step 1: Write RED reuse tests**
  - 5,000 ordinary HUD updates do not increase text/graphics/container counts after warm-up.
  - Risk/strategy/value changes update existing objects.

- [ ] **Step 2: Write RED lifecycle panel tests**
  - playing uses compact HUD;
  - summary shows run summary overlay;
  - countdown shows restart countdown;
  - paused state is explicit;
  - death and level-complete treatments do not permanently hide the normal HUD.

- [ ] **Step 3: Write RED accessibility tests**
  - risk label always contains text band plus numeric percentage.
  - critical state differs by text/shape treatment, not color alone.

- [ ] **Step 4: Implement persistent HUD panels and text objects**
  - Top-left level/timer; top-center strategy; top-right risk; compact lower metric/record panels; center event overlay.
  - Use text strokes/shadows and non-one-pixel critical indicators for compression resilience.

- [ ] **Step 5: Implement summary/countdown/event treatment**
  - No unbounded animation object creation.

- [ ] **Step 6: Run targeted tests and confirm GREEN**

- [ ] **Step 7: Commit**
  - `feat(renderer): add Pixi livestream HUD presentation`

---

### Task 6: Integrate HUD into `SnakeRenderer`

**Files:**
- Modify: `packages/renderer/src/renderer.ts`
- Modify: `packages/renderer/src/types.ts`
- Modify: `packages/renderer/src/index.ts`
- Modify: `packages/renderer/test/renderer.integration.test.ts`

**Interfaces:**
- Extend renderer input with optional rich `hudSnapshot` while preserving current Phase 8 summary compatibility during migration.
- Renderer owns exactly one HUD manager and one bounded HUD event queue.

- [ ] **Step 1: Write RED integration tests**
  - `init` creates one HUD root.
  - `renderFrame` updates rich HUD without altering frame/simulation data.
  - repeated `resize`, theme, skin, quality, and HUD updates do not duplicate HUD roots/listeners.
  - destroy/reinitialize returns HUD counters to baseline.

- [ ] **Step 2: Write RED fallback tests**
  - Legacy Phase 8 `RenderHudSummary` remains renderable by deriving a minimal neutral `HudSnapshot` until the integrated runtime supplies richer evidence.

- [ ] **Step 3: Implement renderer integration**
  - Compute HUD layout only on resize/layout changes.
  - Advance HUD event presentation from renderer presentation time only.

- [ ] **Step 4: Run renderer integration tests and full renderer suite**
  - `pnpm vitest run packages/renderer/test`

- [ ] **Step 5: Commit**
  - `feat(renderer): integrate livestream HUD lifecycle`

---

### Task 7: Preview States and Browser Visual Verification

**Files:**
- Modify: `apps/render-preview/src/main.ts`
- Modify: `apps/render-preview/src/style.css`
- Modify: `apps/render-preview/test/preview-contract.test.ts`
- Modify: `scripts/check-renderer-browser.sh`

**Interfaces:**
- Preview provides deterministic fixture states: `playing`, `critical`, `record`, `summary`, `countdown`.
- Browser script verifies ready state and captures HUD visual evidence at 1080p plus layout assertions at 1440p/4K.

- [ ] **Step 1: Write RED preview contract tests**
  - Fixture selector contains all five states.
  - All fixture metrics are deterministic and evidence-backed.

- [ ] **Step 2: Extend deterministic demo feed**
  - Feed rich HUD snapshots and bounded events; controls remain presentation-only.

- [ ] **Step 3: Extend Chrome smoke script**
  - Assert canvas exact dimensions, HUD ready marker, no browser console errors, no clipping marker, and screenshot output.

- [ ] **Step 4: Build and run preview checks**
  - `pnpm --filter @snake/render-preview build`
  - `pnpm check:renderer-browser`

- [ ] **Step 5: Commit**
  - `feat(renderer): add HUD visual preview gates`

---

### Task 8: HUD Soak, CI, Production Record, Review, and Merge

**Files:**
- Create: `packages/renderer/test/hud-soak.test.ts`
- Modify: `.github/workflows/phase-01-ci.yml`
- Create: `docs/production/PHASE_09_PRODUCTION_READINESS.md`
- Modify: `docs/phases/PHASE_09_LIVESTREAM_HUD.md`

**Interfaces:**
- Permanent CI includes HUD model/layout/events tests, 50,000-update HUD soak, preview build, Chrome HUD smoke, inherited deterministic/simulation gates.

- [ ] **Step 1: Write and run 50,000-update soak**
  - Alternate risk, strategy, counters, lifecycle states, and bounded events.
  - Assert stable object counts and bounded queue/history sizes.

- [ ] **Step 2: Add permanent CI gate**
  - Preserve all inherited Phase 1–8 gates.

- [ ] **Step 3: Run complete branch verification**
  - frozen install;
  - typecheck;
  - all tests;
  - all builds;
  - forbidden API/boundary scans;
  - renderer/HUD target resolutions;
  - renderer and HUD soak gates;
  - compiled Chrome smoke;
  - deterministic engine/AI/simulation checks;
  - worker checks;
  - 1,000-run and 10,000-run simulation paths.

- [ ] **Step 4: Adversarial review the complete diff**
  - Resolve every correctness, lifecycle, resource, visual, or accessibility defect with a failing regression first.

- [ ] **Step 5: Write production-readiness evidence**
  - Record exact candidate SHA, workflow run/job, test count, browser artifact digest, visual states, soak results, and scope boundary.

- [ ] **Step 6: Mark PR ready and squash-merge only after exact-head CI success**

- [ ] **Step 7: Verify resulting `main` commit independently**
  - Require permanent workflow success on the merge commit.
  - Update production record only with verified post-merge evidence.

- [ ] **Step 8: Final Phase 9 status**
  - Mark Phase 9 production-ready only after post-merge `main` verification succeeds.
