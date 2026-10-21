import {
  Component, OnInit, OnDestroy, ElementRef, inject, input, computed, signal, viewChild, effect
} from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, NgFor, NgIf, NgTemplateOutlet, DecimalPipe } from '@angular/common';
import { AllDeliverablesService, SourceDeliverables } from '../../services/all-deliverables.service';
import { DeliverablesConfig } from '../../deliverables-config';
import {
  STATUS_CLASSES, StatusClass, FamilySummary, AssessedDeliverable, CompletenessCell,
  summariseFamilies, reportingCompleteness, needsAttention
} from '../../utils/portfolio-summary';

interface Tooltip {
  x: number;
  y: number;
  value: string;
  label: string;
  detail?: string;
}

/** How many deliverables the attention list shows */
const ATTENTION_LIMIT = 8;

/**
 * Dashboard summary of presidential, ministerial and agency deliverables for the selected year:
 * headline tiles, status by type, quarterly reporting completeness and a "needs attention" list.
 * Statuses use the same rules as the deliverables pages. Used on the admin and guest dashboards.
 */
@Component({
  selector: 'app-deliverables-overview',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, DecimalPipe],
  templateUrl: './deliverables-overview.html',
  styleUrl: './deliverables-overview.css',
})
export class DeliverablesOverview implements OnInit, OnDestroy {
  private service = inject(AllDeliverablesService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Selected year, e.g. "2026" */
  year = input.required<string>();
  /** Whether tiles, bars and rows open the admin deliverables pages (off for guests, who can't open them) */
  linkToPages = input(true);

  readonly statusClasses = STATUS_CLASSES;
  private results = signal<SourceDeliverables[]>([]);
  loading = signal(true);
  showStatusTable = signal(false);
  tip = signal<Tooltip | null>(null);

  /** Width of the status bars, to decide which segments can hold their count */
  private barsArea = viewChild<ElementRef<HTMLElement>>('barsArea');
  private barWidth = signal(0);
  private resizeObserver?: ResizeObserver;

  families = computed<FamilySummary[]>(() => summariseFamilies(this.results(), Number(this.year())));
  failedSources = computed(() => this.families().filter(f => f.failed).map(f => f.source.title));

  completeness = computed(() =>
    this.families().map(f => ({ family: f, cells: reportingCompleteness(f, Number(this.year())) }))
  );

  private attentionAll = computed(() => needsAttention(this.families()));
  attention = computed(() => this.attentionAll().slice(0, ATTENTION_LIMIT));
  attentionMore = computed(() => Math.max(0, this.attentionAll().length - ATTENTION_LIMIT));

  constructor() {
    // Watch the bars' width once they exist (they render after loading)
    effect(() => {
      const el = this.barsArea()?.nativeElement;
      this.resizeObserver?.disconnect();
      // Without ResizeObserver (older browsers, test DOMs) counts stay out of the bars; tooltips and the table still have them
      if (!el || typeof ResizeObserver === 'undefined') return;
      this.resizeObserver = new ResizeObserver(entries => this.barWidth.set(entries[0].contentRect.width));
      this.resizeObserver.observe(el);
    });
  }

  ngOnInit(): void {
    this.service.loadAll().subscribe(results => {
      this.results.set(results);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  share(count: number, total: number): number {
    return total ? count / total : 0;
  }

  percent(value: number | null): string {
    return value === null ? '—' : `${Math.round(value * 100)}%`;
  }

  /** Counts go inside a segment only when they fit with padding; otherwise the legend, tooltip and table carry them. */
  fitsLabel(count: number, total: number): boolean {
    const segment = this.share(count, total) * this.barWidth();
    return segment >= String(count).length * 8 + 14;
  }

  /** Text colour inside a status fill, chosen for contrast with that fill */
  inkFor(status: StatusClass): string {
    return status === 'critical' ? 'ink-light' : 'ink-dark';
  }

  /** Blue step for a reporting share: 0%, under half, half or more, all */
  completenessClass(cell: CompletenessCell): string {
    if (!cell.due) return 'cell-not-due';
    if (cell.share === null) return 'cell-empty';
    if (cell.share === 0) return 'cell-0';
    if (cell.share < 0.5) return 'cell-low';
    if (cell.share < 1) return 'cell-mid';
    return 'cell-full';
  }

  // ── Tooltips (same content on hover and keyboard focus) ──

  showStatusTip(event: Event, family: FamilySummary, status: StatusClass): void {
    const count = family.counts[status];
    const label = this.statusClasses.find(s => s.key === status)!.label;
    this.showTip(event, `${count} (${this.percent(this.share(count, family.total))})`, `${family.source.title} · ${label}`);
  }

  showCellTip(event: Event, family: FamilySummary, cell: CompletenessCell): void {
    const label = `${family.source.title} · ${cell.quarter} ${this.year()}`;
    if (!cell.due) {
      this.showTip(event, 'Not due yet', label, `${cell.reported} of ${cell.expected} reported so far`);
    } else {
      this.showTip(event, this.percent(cell.share), label, `${cell.reported} of ${cell.expected} deliverables reported`);
    }
  }

  private showTip(event: Event, value: string, label: string, detail?: string): void {
    const container = this.host.nativeElement.getBoundingClientRect();
    let x: number, y: number;
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      x = event.clientX - container.left;
      y = event.clientY - container.top;
    } else {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2 - container.left;
      y = rect.top - container.top;
    }
    this.tip.set({ x, y, value, label, detail });
  }

  hideTip(): void {
    this.tip.set(null);
  }

  // ── Navigation ──

  openPage(source: DeliverablesConfig): void {
    if (!this.linkToPages()) return;
    this.router.navigate([source.pagePath], { queryParams: { year: this.year() } });
  }

  openDeliverable(item: AssessedDeliverable): void {
    if (!this.linkToPages()) return;
    this.router.navigate([item.source.pagePath], { queryParams: { year: this.year(), expand: item.deliverable.id } });
  }

  titleOf(item: AssessedDeliverable): string {
    const d = item.deliverable;
    return d.outcome || d.deliverable || d.indicator;
  }

  ownerOf(item: AssessedDeliverable): string {
    const org = item.source.organizationWide;
    const dept = item.deliverable.responsibleDepartment;
    return org && dept === org.value ? 'Organization-wide' : (dept || '—');
  }
}
