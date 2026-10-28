import { Component, ElementRef, OnDestroy, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { StrategicDeliverable } from '../../services/strategic-deliverables.service';
import { kpiTimeline, timelineGeometry, directionNote, TimelinePoint } from '../../utils/kpi-timeline';
import { assess } from '../../utils/kpi-performance';

/**
 * Line chart of one KPI's quarterly results (blue) against its quarterly targets (grey), across
 * every quarter from its first report to its last. The axis is in the KPI's own units.
 */
@Component({
  selector: 'app-kpi-quarter-chart',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe],
  templateUrl: './kpi-quarter-chart.html',
  styleUrl: './kpi-quarter-chart.css',
})
export class KpiQuarterChart implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Drawn at the container's real width, so text stays the same size on any screen */
  private wrap = viewChild<ElementRef<HTMLElement>>('wrap');
  private width = signal(600);
  private resizeObserver?: ResizeObserver;

  deliverable = input.required<StrategicDeliverable>();
  /** Drawing height in viewBox units (the chart scales to its container's width) */
  height = input(240);

  showTable = signal(false);
  tip = signal<{ x: number; y: number; value: string; label: string; detail: string } | null>(null);

  points = computed(() => kpiTimeline(this.deliverable()));
  geometry = computed(() => timelineGeometry(this.points(), Math.max(320, Math.round(this.width())), this.height()));
  direction = computed(() => directionNote(this.deliverable()));

  /** End labels: "Actual" always; "Target" only where it won't sit on top of it */
  endLabels = computed(() => {
    const g = this.geometry();
    const a = g.actual[g.actual.length - 1];
    const t = g.target[g.target.length - 1];
    return {
      actual: a ? { x: a.x + 8, y: a.y + 4 } : null,
      target: t && (!a || Math.abs(t.y - a.y) >= 14) ? { x: t.x + 8, y: t.y + 4 } : null,
    };
  });

  constructor() {
    effect(() => {
      const el = this.wrap()?.nativeElement;
      this.resizeObserver?.disconnect();
      // Without ResizeObserver (older browsers, test DOMs) the chart keeps its default width and scales
      if (!el || typeof ResizeObserver === 'undefined') return;
      this.resizeObserver = new ResizeObserver(entries => {
        const w = entries[0].contentRect.width;
        if (w > 0) this.width.set(w);
      });
      this.resizeObserver.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  statusOf(p: TimelinePoint): string {
    return assess(this.deliverable(), p.actual, p.target, p.year, true).label;
  }

  showTip(event: Event, p: TimelinePoint): void {
    const box = this.host.nativeElement.getBoundingClientRect();
    const rect = (event.target as Element).getBoundingClientRect();
    const fmt = (v: number | null) => (v === null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: 2 }));
    this.tip.set({
      x: rect.left + rect.width / 2 - box.left,
      y: rect.top - box.top,
      value: `${fmt(p.actual)} against target ${fmt(p.target)}`,
      label: p.label,
      detail: this.statusOf(p),
    });
  }

  hideTip(): void {
    this.tip.set(null);
  }
}
