import { Component, OnInit, OnDestroy, ElementRef, inject, input, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, NgFor, NgIf, NgTemplateOutlet, DecimalPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AllDeliverablesService, DELIVERABLE_SOURCES } from '../../services/all-deliverables.service';
import { PdfReportService } from '../../services/pdf-report.service';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { DeliverablesConfig } from '../../deliverables-config';
import {
  STATUS_CLASSES, FamilySummary, AssessedDeliverable, CompletenessCell, StatusRow, Period, StatusClass,
  summariseFamilies, reportingCompleteness, worstFirst, applyFilters, uniqueItems, ownerOf, statusByGroup,
  goodBreakdown, overdueReports, readinessChecks, quarterTrend, quartersWithTrendData, summaryCsv,
  departmentCodeFor, periodLabel, previousPeriod, latestReportedQuarter, ORGANIZATION_WIDE
} from '../../utils/portfolio-summary';
import { isActiveInYear } from '../../utils/kpi-performance';
import { StatusBars } from '../status-bars/status-bars';
import { QuarterSparkline } from '../quarter-sparkline/quarter-sparkline';
import { StatusTrend } from '../status-trend/status-trend';

interface Tooltip {
  x: number;
  y: number;
  value: string;
  label: string;
  detail?: string;
}

/** Change in the share on track since the previous period, in percentage points */
interface TileChange {
  points: number | null;
  since: string;
}

/** How many KPIs the results list shows before "Show all" */
const KPI_LIST_LIMIT = 10;

/** Status chip above the KPI list: a status class, "attention" (at risk or worse), or "" for all */
export type KpiStatusFilter = StatusClass | 'attention' | '';

interface StatusChip {
  key: KpiStatusFilter;
  label: string;
  count: number;
  /** Status class whose colour the chip shows; none for "All" and "Needs attention" */
  cls: StatusClass | null;
}
/** How many deliverables each readiness line lists when opened */
const READINESS_LIST_LIMIT = 10;

/**
 * Dashboard summary of the presidential, ministerial and agency KPIs for a period (a year, or one
 * quarter of it). Period, type and department filters scope every panel. The KPI results list is the
 * centrepiece: every KPI's result against its target, worst first, filtered by status. Statuses use
 * the same rules as the deliverables pages.
 *
 * Admins get links into the admin pages plus the data readiness and overdue panels. Guests get
 * links into the guest KPI pages, with the internal panels hidden.
 */
@Component({
  selector: 'app-deliverables-overview',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgTemplateOutlet, DecimalPipe, DatePipe, StatusBars, QuarterSparkline, StatusTrend],
  templateUrl: './deliverables-overview.html',
  styleUrl: './deliverables-overview.css',
})
export class DeliverablesOverview implements OnInit, OnDestroy {
  private service = inject(AllDeliverablesService);
  private pdf = inject(PdfReportService);
  private globalState = inject(GlobalStateService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private sub?: Subscription;

  /** Selected year, e.g. "2026" */
  year = input.required<string>();
  /** Who is looking: admins link into the admin pages; guests into the guest KPI pages */
  audience = input<'admin' | 'guest'>('admin');
  isAdmin = computed(() => this.audience() === 'admin');

  readonly statusClasses = STATUS_CLASSES;
  readonly typeOptions = DELIVERABLE_SOURCES.map(s => ({ id: s.id, title: s.title }));
  readonly quarterOptions = [null, 0, 1, 2, 3];
  readonly readinessListLimit = READINESS_LIST_LIMIT;

  loading = computed(() => !this.service.loaded());
  showStatusTable = signal(false);
  tip = signal<Tooltip | null>(null);
  downloadingPdf = signal(false);
  pdfError = signal<string | null>(null);

  // ── Period and filters ──
  /** null = full year; 0-3 = Q1-Q4 (shared with the guest KPI pages) */
  quarter = signal<number | null>(null);
  typeFilter = signal('');
  ownerFilter = signal('');
  hasFilters = computed(() => !!this.typeFilter() || !!this.ownerFilter());

  private yearNum = computed(() => Number(this.year()));
  period = computed<Period>(() => ({ year: this.yearNum(), quarter: this.quarter() }));
  periodName = computed(() => periodLabel(this.period()));
  previous = computed(() => previousPeriod(this.period()));

  /** Departments and other owners to filter by: every department, plus any owner used this year */
  ownerOptions = computed(() => {
    const owners = new Set<string>(this.service.departments().map(d => d.name));
    owners.add(ORGANIZATION_WIDE);
    for (const r of this.service.results()) {
      for (const d of r.deliverables) {
        if (isActiveInYear(d, this.yearNum())) owners.add(ownerOf(d));
      }
    }
    if (this.ownerFilter()) owners.add(this.ownerFilter());
    return [...owners].sort((a, b) => a.localeCompare(b));
  });

  // ── Data, all built from the filtered set ──
  private filtered = computed(() =>
    applyFilters(this.service.results(), { type: this.typeFilter(), owner: this.ownerFilter() })
  );
  families = computed<FamilySummary[]>(() => summariseFamilies(this.filtered(), this.yearNum(), this.quarter()));
  private previousFamilies = computed(() =>
    summariseFamilies(this.filtered(), this.previous().year, this.previous().quarter)
  );
  items = computed(() => uniqueItems(this.families()));
  failedSources = computed(() => this.service.results().filter(r => r.failed).map(r => r.source.title));
  latest = computed(() => latestReportedQuarter(this.service.results()));

  changes = computed(() => {
    const before = new Map(this.previousFamilies().map(f => [f.source.id, f.onTrackShare]));
    const since = periodLabel(this.previous());
    return new Map<string, TileChange>(this.families().map(f => {
      const prev = before.get(f.source.id);
      const points = f.onTrackShare === null || prev === null || prev === undefined
        ? null : Math.round((f.onTrackShare - prev) * 100);
      return [f.source.id, { points, since }];
    }));
  });

  readiness = computed(() =>
    this.isAdmin() ? readinessChecks(this.items(), this.yearNum(), this.service.departments()) : []
  );

  breakdowns = computed(() => new Map(this.families().map(f => [f.source.id, goodBreakdown(f.items)])));

  typeRows = computed<StatusRow[]>(() =>
    this.families().map(f => ({ label: f.source.title, counts: f.counts, total: f.total }))
  );

  departmentRows = computed<StatusRow[]>(() => {
    const departments = this.service.departments();
    return statusByGroup(this.items(), i => ownerOf(i.deliverable))
      .map(row => {
        const departmentCode = departmentCodeFor(row.label, departments);
        // Admins open the department page; guests open the KPIs filtered to that owner
        return { ...row, departmentCode, clickable: this.isAdmin() ? !!departmentCode : true };
      });
  });

  completeness = computed(() =>
    this.families().map(f => ({ family: f, cells: reportingCompleteness(f, this.yearNum()) }))
  );

  overdue = computed(() => overdueReports(this.items(), this.yearNum(), this.service.departments()));

  trend = computed(() => quarterTrend(this.families(), this.yearNum()));
  trendQuarters = computed(() => quartersWithTrendData(this.trend()));

  // ── KPI results: every KPI for the period, worst first ──
  kpiStatus = signal<KpiStatusFilter>('');
  kpiSearch = signal('');
  kpiShowAll = signal(false);

  private statusCounts = computed(() => {
    const counts: Record<StatusClass, number> = { good: 0, warning: 0, critical: 0, none: 0 };
    this.items().forEach(i => counts[i.status]++);
    return counts;
  });

  kpiChips = computed<StatusChip[]>(() => {
    const c = this.statusCounts();
    return [
      { key: '', label: 'All', count: this.items().length, cls: null },
      { key: 'attention', label: 'Needs attention', count: c.warning + c.critical, cls: null },
      ...STATUS_CLASSES.map(s => ({ key: s.key, label: s.label, count: c[s.key], cls: s.key })),
    ];
  });

  private kpiMatches = computed(() => {
    const status = this.kpiStatus();
    const text = this.kpiSearch().trim().toLowerCase();
    return [...this.items()]
      .filter(i => !status || (status === 'attention' ? i.status === 'warning' || i.status === 'critical' : i.status === status))
      .filter(i => !text || [i.deliverable.indicator, i.deliverable.outcome, i.deliverable.deliverable, ownerOf(i.deliverable)]
        .some(v => (v || '').toLowerCase().includes(text)))
      .sort(worstFirst);
  });
  kpiRows = computed(() => this.kpiShowAll() ? this.kpiMatches() : this.kpiMatches().slice(0, KPI_LIST_LIMIT));
  kpiHidden = computed(() => Math.max(0, this.kpiMatches().length - this.kpiRows().length));
  kpiMatchCount = computed(() => this.kpiMatches().length);

  ngOnInit(): void {
    this.sub = this.globalState.selectedQuarter$.subscribe(q => this.quarter.set(q));
    this.service.refresh();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setQuarter(q: number | null): void {
    this.globalState.setQuarter(q);
  }

  quarterName(q: number | null): string {
    return q === null ? 'Full year' : `Q${q + 1}`;
  }

  setType(value: string): void {
    this.typeFilter.set(value);
  }

  setOwner(value: string): void {
    this.ownerFilter.set(value);
  }

  clearFilters(): void {
    this.typeFilter.set('');
    this.ownerFilter.set('');
  }

  setKpiStatus(key: KpiStatusFilter): void {
    this.kpiStatus.set(key);
    this.kpiShowAll.set(false);
  }

  setKpiSearch(value: string): void {
    this.kpiSearch.set(value);
    this.kpiShowAll.set(false);
  }

  /** Icon for a KPI's status: ✓ good, ! at risk, ✕ off track, – not scored */
  statusIcon(status: StatusClass): string {
    return STATUS_CLASSES.find(s => s.key === status)?.icon ?? '';
  }

  share(count: number, total: number): number {
    return total ? count / total : 0;
  }

  percent(value: number | null): string {
    return value === null ? '—' : `${Math.round(value * 100)}%`;
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

  // ── Reporting grid tooltip (same content on hover and keyboard focus) ──

  showCellTip(event: Event, family: FamilySummary, cell: CompletenessCell): void {
    const label = `${family.source.title} · ${cell.quarter} ${this.year()}`;
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
    this.tip.set(cell.due
      ? { x, y, value: this.percent(cell.share), label, detail: `${cell.reported} of ${cell.expected} KPIs reported` }
      : { x, y, value: 'Not due yet', label, detail: `${cell.reported} of ${cell.expected} reported so far` });
  }

  hideTip(): void {
    this.tip.set(null);
  }

  // ── Export ──

  private scopeText(): string {
    const type = this.typeOptions.find(t => t.id === this.typeFilter())?.title ?? 'All types';
    return `${type} · ${this.ownerFilter() || 'All departments'}`;
  }

  /** Downloads the deliverables shown, with each quarter's figures, as a spreadsheet-ready CSV. */
  downloadSummary(): void {
    const csv = summaryCsv(this.items(), this.yearNum());
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `nimasa-deliverables-${this.year()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** Downloads this view as a PDF report for the period and filters. */
  async downloadPdf(): Promise<void> {
    this.downloadingPdf.set(true);
    this.pdfError.set(null);
    try {
      await this.pdf.downloadSummary({
        period: this.period(),
        scope: this.scopeText(),
        families: this.families(),
        items: this.items(),
        latest: this.latest(),
      });
    } catch {
      this.pdfError.set("The PDF couldn't be created. Check your connection and try again.");
    } finally {
      this.downloadingPdf.set(false);
    }
  }

  // ── Navigation ──

  private openGuestKpis(params: Record<string, string>): void {
    this.router.navigate(['/guest/kpis'], { queryParams: params });
  }

  openPage(source: DeliverablesConfig): void {
    if (this.isAdmin()) this.router.navigate([source.pagePath], { queryParams: { year: this.year() } });
    else this.openGuestKpis({ type: source.id });
  }

  openTypeRow(row: StatusRow): void {
    const family = this.families().find(f => f.source.title === row.label);
    if (family) this.openPage(family.source);
  }

  openDeliverable(item: AssessedDeliverable): void {
    if (this.isAdmin()) {
      this.router.navigate([item.source.pagePath], { queryParams: { year: this.year(), expand: item.deliverable.id } });
    } else {
      this.router.navigate(['/guest/kpis', item.deliverable.id]);
    }
  }

  openDepartmentRow(row: StatusRow): void {
    if (this.isAdmin()) {
      if (row.departmentCode) this.router.navigate(['/admin/organization/departments', row.departmentCode]);
    } else {
      this.openGuestKpis({ owner: row.label });
    }
  }

  openDepartment(code: string | null | undefined): void {
    if (this.isAdmin() && code) this.router.navigate(['/admin/organization/departments', code]);
  }

  titleOf(item: AssessedDeliverable): string {
    const d = item.deliverable;
    return d.outcome || d.deliverable || d.indicator;
  }

  ownerOf(item: AssessedDeliverable): string {
    return ownerOf(item.deliverable);
  }
}
