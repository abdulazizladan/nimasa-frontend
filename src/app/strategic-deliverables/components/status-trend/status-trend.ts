import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TrendSeries } from '../../utils/portfolio-summary';

/** Each page keeps one colour wherever it appears, so filtering never repaints a line (categorical slots 1-3). */
const SERIES_COLORS: Record<string, string> = {
  presidential: '#2a78d6',
  ministerial: '#eb6834',
  agency: '#1baf7a',
};

const W = 600, H = 240;
const PLOT = { left: 48, right: 500, top: 16, bottom: 200 };
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

interface PlotPoint { x: number; y: number; value: number; quarter: string; scored: number; good: number; }
interface PlotSeries {
  id: string;
  label: string;
  /** Short name for the end label, e.g. "Presidential" */
  shortLabel: string;
  color: string;
  points: PlotPoint[];
  path: string;
  endLabelY: number | null;
}

/**
 * Share of deliverables surpassed, met or on track in each quarter, one line per page,
 * on a single 0-100% axis. End labels are drawn only where they don't collide; the legend,
 * tooltips and table always carry every value.
 */
@Component({
  selector: 'app-status-trend',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './status-trend.html',
  styleUrl: './status-trend.css',
})
export class StatusTrend {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  series = input.required<TrendSeries[]>();
  year = input.required<string | number>();

  readonly W = W;
  readonly H = H;
  readonly plot = PLOT;
  readonly quarters = QUARTERS;
  readonly ticks = [0, 25, 50, 75, 100];
  showTable = signal(false);
  tip = signal<{ x: number; y: number; value: string; label: string; detail: string } | null>(null);

  xFor(q: number): number {
    return PLOT.left + 20 + q * ((PLOT.right - PLOT.left - 40) / 3);
  }

  yFor(percent: number): number {
    return PLOT.bottom - (percent / 100) * (PLOT.bottom - PLOT.top);
  }

  plotted = computed<PlotSeries[]>(() => {
    const series: PlotSeries[] = this.series().map(s => {
      const points: PlotPoint[] = [];
      s.values.forEach((v, q) => {
        if (v === null) return;
        const value = Math.round(v * 100);
        points.push({
          x: this.xFor(q), y: this.yFor(value), value, quarter: QUARTERS[q],
          scored: s.scored[q], good: Math.round(v * s.scored[q]),
        });
      });
      return {
        id: s.source.id, label: s.source.title, shortLabel: s.source.badge, color: SERIES_COLORS[s.source.id] ?? '#64748b',
        points, path: points.map(p => `${p.x},${p.y}`).join(' '), endLabelY: null,
      };
    });
    // End labels only for lines that reach the latest quarter with data, and only where they
    // sit at least 14px from every other such label. The legend still names every line.
    const lastX = Math.max(...series.flatMap(s => s.points.map(p => p.x)), -Infinity);
    const ending = series.filter(s => s.points.length && s.points[s.points.length - 1].x === lastX);
    const endY = (s: PlotSeries) => s.points[s.points.length - 1].y;
    for (const s of ending) {
      const crowded = ending.some(o => o !== s && Math.abs(endY(o) - endY(s)) < 14);
      if (!crowded) s.endLabelY = endY(s);
    }
    return series;
  });

  cell(s: TrendSeries, q: number): string {
    const v = s.values[q];
    return v === null ? '—' : `${Math.round(v * 100)}%`;
  }

  showTip(event: Event, s: PlotSeries, p: PlotPoint): void {
    const box = this.host.nativeElement.getBoundingClientRect();
    const rect = (event.target as Element).getBoundingClientRect();
    this.tip.set({
      x: rect.left + rect.width / 2 - box.left,
      y: rect.top - box.top,
      value: `${p.value}%`,
      label: `${s.label} · ${p.quarter} ${this.year()}`,
      detail: `${p.good} of ${p.scored} scored deliverables`,
    });
  }

  hideTip(): void {
    this.tip.set(null);
  }
}
