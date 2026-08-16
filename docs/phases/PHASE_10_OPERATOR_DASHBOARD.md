# Phase 10 — Operator Dashboard

## Primary agents
- Operator Dashboard Agent
- Architecture Agent
- Failure Systems Agent

## Objective
Create a separate operator surface for safe live control of gameplay, AI, failure behavior, visuals, audio, stream settings, and presets without leaking private controls into the public stream view.

## Deliverables
- `/operator` route
- validated configuration forms
- game controls
- AI tuning controls
- private failure controls
- stream controls
- audio/visual controls
- presets
- config export/import
- destructive-action confirmations
- live validation/error display

## Control groups
### Game
Level, speed, starting length, difficulty, progression behavior, restart.

### AI
Reasoning profile, prediction steps, risk tolerance, food aggressiveness, tail-follow policy, Hamiltonian fallback, strategy preferences.

### Failure
Enable/disable, target failures/hour, probability, minimum runtime, risk/level/length/occupancy restrictions, plausible-only mode.

### Streaming
Auto restart, restart delay, celebration duration, HUD visibility, milestone alerts, branding, stream title/subtitle.

### Audio
Master mute, music, effects, individual event volumes.

### Visual
Snake skin, theme, particle density, glow, quality, animation intensity.

## Presets
- Safe Stream
- Balanced Stream
- Chaos Stream
- Record Attempt
- Demo

Presets must be editable after application and exportable as versioned JSON.

## Safety rules
- `Reset Records` requires explicit confirmation.
- Stream mode hides/disables accidental destructive controls.
- Private failure configuration must never appear in public state serialization.
- Invalid imported config is rejected with actionable validation errors.

## Required tests
- every operator command reaches the correct domain/application service
- invalid config cannot be applied
- preset round-trip export/import
- destructive confirmation behavior
- stream/private state separation
- reload preserves operator settings where intended

## Exit criteria
An operator can safely manage a live session without editing code or exposing hidden configuration to viewers.
