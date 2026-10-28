import { Component, computed, input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { StrategicDeliverable } from '../../services/strategic-deliverables.service';
import { QUARTER_KEYS } from '../../utils/kpi-performance';

interface SparkPoint {
  quarter: string;
  x: number;
  actual: number;
  target: number;
  yActual: number;
  yTarget: number;
}

const WIDTH = 120;
const HEIGHT = 36;
const PAD_X = 6;
const PAD_Y = 6;

/**
 * One deliverable's quarterly actuals (blue) against its quarterly targets (grey) for a year.
 * Quarters without a report leave a gap. Units are the deliverable's own, so the lines compare fairly.
 */
@Component({
  selector: 'app-quarter-sparkline',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <svg *ngIf="points().length; else none" class="spark" [attr.viewBox]="'0 0 ' + width + ' ' + height"
      role="img" [attr.aria-label]="summary()">
      <polyline *ngIf="points().length > 1" class="target" [attr.points]="line('yTarget')"></polyline>
      <polyline *ngIf="points().length > 1" class="actual" [attr.points]="line('yActual')"></polyline>
      <circle *ngFor="let p of points(); let last = last" class="dot" [class.last]="last"
        [attr.cx]="p.x" [attr.cy]="p.yActual" [attr.r]="last ? 4 : 3">
        <title>{{ p.quarter }} {{ year() }}: {{ p.actual }} (target {{ p.target }})</title>
      </circle>
    </svg>
    <ng-template #none><span class="none">No reports</span></ng-template>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    .spark { width: 120px; height: 36px; overflow: visible; }
    .target { fill: none; stroke: #94a3b8; stroke-width: 1.5; stroke-linejoin: round; }
    .actual { fill: none; stroke: #2a78d6; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .dot { fill: #2a78d6; stroke: #ffffff; stroke-width: 1.5; }
    .none { font-size: 12px; line-height: 1.4; color: #64748b; }
  `],
})
export class QuarterSparkline {
  deliverable = input.required<StrategicDeliverable>();
  year = input.required<string | number>();

  readonly width = WIDTH;
  readonly height = HEIGHT;

  points = computed<SparkPoint[]>(() => {
    const perf = this.deliverable().yearlyPerformance?.[String(this.year())] || {};
    const raw = QUARTER_KEYS.map((key, i) => ({ i, key, entry: perf[key] }))
      .filter(r => r.entry && r.entry.actual !== undefined && r.entry.actual !== null);
    if (!raw.length) return [];

    const values = raw.flatMap(r => [Number(r.entry.actual), Number(r.entry.target ?? r.entry.actual)]);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) { min -= 1; max += 1; }
    const y = (v: number) => HEIGHT - PAD_Y - ((v - min) / (max - min)) * (HEIGHT - 2 * PAD_Y);
    const step = (WIDTH - 2 * PAD_X) / 3;

    return raw.map(r => {
      const actual = Number(r.entry.actual);
      const target = Number(r.entry.target ?? r.entry.actual);
      return { quarter: r.key.toUpperCase(), x: PAD_X + r.i * step, actual, target, yActual: y(actual), yTarget: y(target) };
    });
  });

  summary = computed(() =>
    'Quarterly results: ' + this.points().map(p => `${p.quarter} ${p.actual} against target ${p.target}`).join('; ')
  );

  line(key: 'yActual' | 'yTarget'): string {
    return this.points().map(p => `${p.x},${p[key]}`).join(' ');
  }
}
