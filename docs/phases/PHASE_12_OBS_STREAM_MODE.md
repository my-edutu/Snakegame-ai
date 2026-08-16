# Phase 12 — OBS / Fullscreen Stream Mode

## Primary agents
- Release / Stream Reliability Agent
- Livestream UX Agent
- Operator Dashboard Agent

## Objective
Make the game safe and reliable as an OBS Browser Source and fullscreen autonomous stream client.

## Deliverables
- dedicated `/stream` route
- fullscreen presentation
- interaction lockout
- automatic run lifecycle
- URL/preset configuration support where safe
- reconnect/reload behavior
- stream-safe error fallback
- browser-source setup documentation

## Tasks
1. Ensure stream mode exposes no private operator controls.
2. Disable accidental pointer/keyboard destructive interactions.
3. Auto-progress levels and auto-restart runs.
4. Restore active run or safe checkpoint after reload.
5. Add optional transparent/solid background modes where rendering permits.
6. Validate 1080p, 1440p, and 4K browser-source layouts.
7. Add visibility/focus handling so browser-source behavior does not corrupt simulation timing.
8. Add safe fatal-error screen plus automatic recovery hook.
9. Ensure route can run unattended after initial load.
10. Document recommended OBS Browser Source settings.

## Reliability tests
- repeated death/restart cycles
- page reload mid-run
- browser tab visibility changes
- fullscreen enter/exit
- stream route opened without operator route
- network offline after initial load
- graphics context interruption/recovery where testable

## Exit criteria
The `/stream` route can be loaded as an OBS Browser Source, run autonomously, remain readable at target resolutions, and recover safely from common browser lifecycle disruptions.
