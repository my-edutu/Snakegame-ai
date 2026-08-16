export interface FrameMetricsSnapshot {
  readonly sampleCount: number;
  readonly averageFrameMs: number;
  readonly peakFrameMs: number;
  readonly fps: number;
}

export class FrameMetrics {
  private readonly windowSize: number;
  private readonly samples: number[] = [];

  constructor(windowSize = 120) {
    if (!Number.isInteger(windowSize) || windowSize <= 0) throw new Error('windowSize must be a positive integer');
    this.windowSize = windowSize;
  }

  record(frameMs: number): void {
    if (!Number.isFinite(frameMs) || frameMs < 0) return;
    this.samples.push(frameMs);
    if (this.samples.length > this.windowSize) this.samples.splice(0, this.samples.length - this.windowSize);
  }

  snapshot(): FrameMetricsSnapshot {
    const sampleCount = this.samples.length;
    if (sampleCount === 0) return { sampleCount: 0, averageFrameMs: 0, peakFrameMs: 0, fps: 0 };
    const total = this.samples.reduce((sum, value) => sum + value, 0);
    const averageFrameMs = total / sampleCount;
    return {
      sampleCount,
      averageFrameMs,
      peakFrameMs: Math.max(...this.samples),
      fps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
    };
  }

  reset(): void {
    this.samples.length = 0;
  }
}
