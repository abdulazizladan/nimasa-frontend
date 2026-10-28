import { Component, ElementRef, OnDestroy, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { STATUS_CLASSES, StatusClass, StatusRow } from '../../utils/portfolio-summary';

/**
 * 100% stacked status bars, one row per group (a page, a department, a priority area).
 * Each segment shows its count when it fits, and a tooltip with the count and share on hover
 * or keyboard focus. The legend is drawn by the parent, once per card.
 */
@Component({
  selector: 'app-status-bars',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './status-bars.html',
  styleUrl: './status-bars.css',
})
export class StatusBars implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  rows = input.required<StatusRow[]>();
  /** Whether rows open something when clicked (labels become buttons) */
  clickable = input(false);
  /** Shown in a row with no deliverables */
  emptyText = input('No deliverables');
  rowSelect = output<StatusRow>();

  readonly statusClasses = STATUS_CLASSES;
  tip = signal<{ x: number; y: number; value: string; label: string } | null>(null);

  /** Width of the bars, to decide which segments can hold their count */
  private track = viewChild<ElementRef<HTMLElement>>('track');
  private barWidth = signal(0);
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const el = this.track()?.nativeElement;
      this.resizeObserver?.disconnect();
      // Without ResizeObserver (older browsers, test DOMs) counts stay out of the bars; the tooltip still has them
      if (!el || typeof ResizeObserver === 'undefined') return;
      this.resizeObserver = new ResizeObserver(entries => this.barWidth.set(entries[0].contentRect.width));
      this.resizeObserver.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  fitsLabel(count: number, total: number): boolean {
    return total > 0 && (count / total) * this.barWidth() >= String(count).length * 8 + 14;
  }

  /** Text colour inside a status fill, chosen for contrast with that fill */
  inkFor(status: StatusClass): string {
    return status === 'critical' ? 'ink-light' : 'ink-dark';
  }

  isClickable(row: StatusRow): boolean {
    return this.clickable() && row.clickable !== false;
  }

  select(row: StatusRow): void {
    if (this.isClickable(row)) this.rowSelect.emit(row);
  }

  showTip(event: Event, row: StatusRow, status: StatusClass): void {
    const count = row.counts[status];
    const label = this.statusClasses.find(s => s.key === status)!.label;
    const box = this.host.nativeElement.getBoundingClientRect();
    let x: number, y: number;
    if (event instanceof MouseEvent) {
      x = event.clientX - box.left;
      y = event.clientY - box.top;
    } else {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2 - box.left;
      y = rect.top - box.top;
    }
    this.tip.set({ x, y, value: `${count} of ${row.total} (${Math.round((count / row.total) * 100)}%)`, label: `${row.label} · ${label}` });
  }

  hideTip(): void {
    this.tip.set(null);
  }
}
