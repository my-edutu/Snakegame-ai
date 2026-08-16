import { Container, Graphics, Text } from 'pixi.js';
import { derivePublicStrategyCopy, formatCountdown, formatHudDuration, selectNextHudTarget } from './hud-copy.js';
import type { HudEngagementEvent } from './hud-events.js';
import type { HudLayout, HudRect } from './hud-layout.js';
import type { HudLifecycle, HudSnapshot } from './hud-types.js';
import type { QualityPreset } from './quality.js';
import type { EnvironmentTheme } from './themes.js';

export interface HudResourceCounts {
  readonly containers: number;
  readonly graphics: number;
  readonly texts: number;
}

export interface HudPresentationSnapshot {
  readonly levelText: string;
  readonly timerText: string;
  readonly strategyText: string;
  readonly riskText: string;
  readonly primaryText: string;
  readonly recordText: string;
  readonly centerText: string;
  readonly eventText: string;
}

export interface HudDrawableManager {
  update(snapshot: HudSnapshot, layout: HudLayout, theme: EnvironmentTheme, quality: QualityPreset): void;
  updateEvent(event: HudEngagementEvent | null, layout: HudLayout, theme: EnvironmentTheme, quality: QualityPreset): void;
  getResourceCounts(): HudResourceCounts;
  getPresentationSnapshot(): HudPresentationSnapshot;
  destroy(): void;
}

const PANEL_ALPHA = 0.76;

const setTextStyle = (text: Text, fontSize: number, fill = '#F7FAFF', weight: '400' | '600' | '700' = '600'): void => {
  text.style.fontSize = fontSize;
  text.style.fill = fill;
  text.style.fontWeight = weight;
  text.style.fontFamily = 'Arial, Helvetica, sans-serif';
  text.style.stroke = { color: '#000000', width: Math.max(2, fontSize * 0.07), join: 'round' };
};

const placeText = (text: Text, rect: HudRect, inset: number): void => {
  text.position.set(rect.x + inset, rect.y + inset);
  text.style.wordWrap = true;
  text.style.wordWrapWidth = Math.max(1, rect.width - inset * 2);
};

const drawPanel = (graphic: Graphics, rect: HudRect, theme: EnvironmentTheme, accent: string, alpha = PANEL_ALPHA): void => {
  const radius = Math.max(8, Math.min(rect.width, rect.height) * 0.08);
  graphic.clear()
    .roundRect(rect.x, rect.y, Math.max(0, rect.width), Math.max(0, rect.height), radius)
    .fill({ color: theme.board, alpha })
    .stroke({ color: accent, alpha: 0.72, width: Math.max(2, rect.height * 0.012) });
};

const percentage = (value: number): string => `${value.toFixed(value >= 10 ? 1 : 2)}%`;

export const createHudDrawableManager = (layer: Container): HudDrawableManager => {
  const root = new Container({ label: 'livestream-hud-root' });
  layer.addChild(root);

  const topLeftPanel = new Graphics({ label: 'hud-level-panel' });
  const strategyPanel = new Graphics({ label: 'hud-strategy-panel' });
  const riskPanel = new Graphics({ label: 'hud-risk-panel' });
  const bottomLeftPanel = new Graphics({ label: 'hud-primary-panel' });
  const bottomRightPanel = new Graphics({ label: 'hud-record-panel' });
  const centerPanel = new Graphics({ label: 'hud-center-panel' });
  const eventPanel = new Graphics({ label: 'hud-event-panel' });

  const levelText = new Text({ label: 'hud-level-text', text: '' });
  const timerText = new Text({ label: 'hud-timer-text', text: '' });
  const strategyText = new Text({ label: 'hud-strategy-text', text: '' });
  const riskText = new Text({ label: 'hud-risk-text', text: '' });
  const primaryText = new Text({ label: 'hud-primary-text', text: '' });
  const recordText = new Text({ label: 'hud-record-text', text: '' });
  const centerText = new Text({ label: 'hud-center-text', text: '' });
  const eventText = new Text({ label: 'hud-event-text', text: '' });

  root.addChild(topLeftPanel, strategyPanel, riskPanel, bottomLeftPanel, bottomRightPanel, centerPanel, eventPanel, levelText, timerText, strategyText, riskText, primaryText, recordText, centerText, eventText);

  let destroyed = false;
  let currentLifecycle: HudLifecycle = 'playing';
  let presentation: HudPresentationSnapshot = {
    levelText: '', timerText: '', strategyText: '', riskText: '', primaryText: '', recordText: '', centerText: '', eventText: '',
  };

  const update = (snapshot: HudSnapshot, layout: HudLayout, theme: EnvironmentTheme, quality: QualityPreset): void => {
    if (destroyed) return;
    currentLifecycle = snapshot.run.lifecycle;
    const inset = Math.max(12, layout.safeMargin * 0.46);
    const strategy = derivePublicStrategyCopy(snapshot.strategy);
    const target = snapshot.completeness === 'rich' ? selectNextHudTarget(snapshot) : null;
    const riskBand = snapshot.risk.band.toUpperCase();
    const risk = `${riskBand} RISK  ${Math.round(snapshot.risk.score)}%`;
    const level = snapshot.completeness === 'rich' ? `LEVEL ${snapshot.level.number}/${snapshot.level.total}  ${snapshot.level.name.toUpperCase()}` : `LEVEL ${snapshot.level.number}  ${snapshot.level.name.toUpperCase()}`;
    const timer = snapshot.completeness === 'rich' ? `RUN ${snapshot.run.number}  •  ${formatHudDuration(snapshot.run.elapsedTicks, snapshot.run.tickDurationMs)}` : 'LIVE';
    const primary = snapshot.completeness === 'rich'
      ? `LENGTH  ${snapshot.primary.length}\nOCCUPANCY  ${percentage(snapshot.primary.occupancyPercent)}\nSCORE  ${Math.round(snapshot.primary.score).toLocaleString('en-US')}\nFOOD  ${snapshot.primary.foodEaten}  •  SAFE MOVES  ${snapshot.primary.safeMoves}`
      : `LENGTH  ${snapshot.primary.length}\nOCCUPANCY  ${percentage(snapshot.primary.occupancyPercent)}\nSCORE  ${Math.round(snapshot.primary.score).toLocaleString('en-US')}`;
    const record = snapshot.completeness === 'legacy'
      ? 'RICH RUN STATS\nAWAITING INTEGRATED RUNTIME'
      : target === null
        ? `BEST OCCUPANCY  ${percentage(snapshot.records.bestOccupancyPercent)}\nHIGHEST LEVEL  ${snapshot.records.highestLevel}\nGAMES  ${snapshot.records.totalGames}  •  DEATHS  ${snapshot.records.deaths}\nSTREAK  ${snapshot.run.levelStreak}`
        : `${target.label}\n${formatTarget(target.current, target.unit)}  →  ${formatTarget(target.target, target.unit)}\nBEST OCCUPANCY  ${percentage(snapshot.records.bestOccupancyPercent)}\nHIGHEST LEVEL  ${snapshot.records.highestLevel}`;
    const center = centerCopy(snapshot);

    presentation = { ...presentation, levelText: level, timerText: timer, strategyText: strategy, riskText: risk, primaryText: primary, recordText: record, centerText: center };

    const glowAlpha = 0.6 + quality.glowStrength * 0.25;
    drawPanel(topLeftPanel, layout.topLeft, theme, theme.ambient, PANEL_ALPHA);
    drawPanel(strategyPanel, layout.topCenter, theme, theme.grid, PANEL_ALPHA);
    drawPanel(riskPanel, layout.topRight, theme, snapshot.risk.band === 'critical' ? '#FFFFFF' : theme.hazard, PANEL_ALPHA);
    drawPanel(bottomLeftPanel, layout.bottomLeft, theme, theme.ambient, PANEL_ALPHA);
    drawPanel(bottomRightPanel, layout.bottomRight, theme, theme.portal, PANEL_ALPHA);

    levelText.text = level; timerText.text = timer; strategyText.text = strategy; riskText.text = risk; primaryText.text = primary; recordText.text = record; centerText.text = center;
    setTextStyle(levelText, layout.typography.heading, '#FFFFFF', '700');
    setTextStyle(timerText, layout.typography.body, theme.ambient, '600');
    setTextStyle(strategyText, layout.typography.heading, '#FFFFFF', '700');
    setTextStyle(riskText, layout.typography.primary, snapshot.risk.band === 'critical' ? '#FFFFFF' : theme.hazard, '700');
    setTextStyle(primaryText, layout.typography.body, '#FFFFFF', '600');
    setTextStyle(recordText, layout.typography.body, '#FFFFFF', '600');
    setTextStyle(centerText, layout.typography.event, '#FFFFFF', '700');
    placeText(levelText, layout.topLeft, inset);
    timerText.position.set(layout.topLeft.x + inset, layout.topLeft.y + layout.topLeft.height - inset - layout.typography.body * 1.25);
    placeText(strategyText, layout.topCenter, inset); placeText(riskText, layout.topRight, inset); placeText(primaryText, layout.bottomLeft, inset); placeText(recordText, layout.bottomRight, inset);

    centerPanel.visible = center.length > 0; centerText.visible = center.length > 0;
    if (center.length > 0) {
      hideEvent();
      drawPanel(centerPanel, layout.event, theme, centerAccent(snapshot, theme), Math.min(0.94, glowAlpha + 0.18));
      centerText.position.set(layout.event.x + layout.event.width / 2, layout.event.y + layout.event.height / 2);
      centerText.anchor.set(0.5); centerText.style.align = 'center'; centerText.style.wordWrap = true; centerText.style.wordWrapWidth = layout.event.width - inset * 2;
    } else centerPanel.clear();
  };

  const hideEvent = (): void => {
    eventPanel.clear(); eventPanel.visible = false; eventText.visible = false; eventText.text = '';
    presentation = { ...presentation, eventText: '' };
  };

  const updateEvent = (event: HudEngagementEvent | null, layout: HudLayout, theme: EnvironmentTheme, quality: QualityPreset): void => {
    if (destroyed || currentLifecycle !== 'playing' || event === null) { hideEvent(); return; }
    const copy = eventCopy(event);
    presentation = { ...presentation, eventText: copy };
    const rect: HudRect = { x: layout.event.x + layout.event.width * 0.08, y: layout.event.y + layout.event.height * 0.08, width: layout.event.width * 0.84, height: layout.event.height * 0.42 };
    eventPanel.visible = true; eventText.visible = true;
    drawPanel(eventPanel, rect, theme, eventAccent(event, theme), Math.min(0.92, 0.72 + quality.glowStrength * 0.16));
    eventText.text = copy; setTextStyle(eventText, layout.typography.heading, '#FFFFFF', '700');
    eventText.anchor.set(0.5); eventText.style.align = 'center'; eventText.style.wordWrap = true; eventText.style.wordWrapWidth = rect.width * 0.9;
    eventText.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
  };

  return {
    update,
    updateEvent,
    getResourceCounts: () => ({ containers: 1, graphics: 7, texts: 8 }),
    getPresentationSnapshot: () => ({ ...presentation }),
    destroy: () => { if (destroyed) return; destroyed = true; root.removeFromParent(); root.destroy({ children: true }); },
  };
};

const formatTarget = (value: number, unit: string): string => unit === 'percent' ? percentage(value) : unit === 'score' ? Math.round(value).toLocaleString('en-US') : String(Math.round(value));

const centerCopy = (snapshot: HudSnapshot): string => {
  switch (snapshot.run.lifecycle) {
    case 'summary': {
      const summary = snapshot.runSummary;
      if (summary === null) return 'RUN SUMMARY';
      const records = summary.newRecords.length > 0 ? `\nNEW RECORD  •  ${summary.newRecords.join(' • ')}` : '';
      return `RUN SUMMARY\nSCORE ${Math.round(summary.score).toLocaleString('en-US')}  •  MAX LENGTH ${summary.maxLength}\nMAX OCCUPANCY ${percentage(summary.maxOccupancyPercent)}  •  LEVEL ${summary.levelReached}${records}`;
    }
    case 'restart-countdown': return `RESTARTING IN ${formatCountdown(snapshot.run.countdownTicksRemaining, snapshot.run.tickDurationMs)}`;
    case 'paused': return 'PAUSED';
    case 'celebrating': return 'LEVEL COMPLETE';
    case 'awaiting-operator': return 'RUN COMPLETE';
    case 'playing': return '';
  }
};

const centerAccent = (snapshot: HudSnapshot, theme: EnvironmentTheme): string => snapshot.run.lifecycle === 'paused' ? '#FFFFFF' : snapshot.run.lifecycle === 'summary' ? '#FFD34D' : snapshot.run.lifecycle === 'restart-countdown' ? theme.portal : theme.ambient;

const eventCopy = (event: HudEngagementEvent): string => {
  switch (event.kind) {
    case 'record': return `NEW RECORD  •  ${event.label}`;
    case 'critical-survival': return `CRITICAL SURVIVAL  •  ${event.label}`;
    case 'near-death': return `CLOSE CALL  •  ${event.label}`;
    case 'level-complete': return `LEVEL COMPLETE  •  ${event.label}`;
    case 'milestone': return `MILESTONE  •  ${event.label}`;
    case 'strategy-change': return `AI STRATEGY  •  ${event.label}`;
  }
};

const eventAccent = (event: HudEngagementEvent, theme: EnvironmentTheme): string => event.kind === 'record' ? '#FFD34D' : event.kind === 'near-death' || event.kind === 'critical-survival' ? theme.hazard : event.kind === 'level-complete' ? '#55FF9A' : event.kind === 'milestone' ? theme.ambient : theme.grid;
