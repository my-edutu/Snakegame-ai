import type { SimulationBatchReport } from './types.js';

export function stableReportJson(report: SimulationBatchReport): string {
  return `${JSON.stringify(report)}\n`;
}

export function humanReport(report: SimulationBatchReport): string {
  const lines = [
    `${report.runCount.toLocaleString('en-US')} simulations`,
    `Deaths: ${report.terminalCounts.death}`,
    `Board filled: ${report.terminalCounts['board-filled']}`,
    `Simulation caps: ${report.terminalCounts['simulation-cap']}`,
    `No-move terminals: ${report.terminalCounts['no-move']}`,
    `Median survival ticks: ${report.ticks.p50}`,
    `P95 max occupancy: ${report.maxOccupancyPercent.p95.toFixed(2)}%`,
    `Peak risk: ${report.risk.peak.toFixed(2)}`,
    `Near-death moments: ${report.nearDeathCount}`,
    `Hamiltonian entries: ${report.hamiltonian.entries}`,
  ];
  const causes = Object.entries(report.deathCauses);
  if (causes.length > 0) lines.push(`Death causes: ${causes.map(([key, count]) => `${key}=${count}`).join(', ')}`);
  if (report.topReplays.length > 0) {
    lines.push('Top replay commands:');
    for (const artifact of report.topReplays) lines.push(`- ${artifact.command}`);
  }
  return `${lines.join('\n')}\n`;
}
