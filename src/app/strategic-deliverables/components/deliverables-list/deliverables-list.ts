import { Component, OnInit, inject, computed, signal, effect, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StrategicDeliverablesStore } from '../../store/strategic-deliverables.store';
import { StrategicDeliverable } from '../../services/strategic-deliverables.service';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../auth/services/auth.service';
import { DELIVERABLES_CONFIG } from '../../deliverables-config';
import * as KPI from '../../utils/kpi-performance';
import { Assessment, YearSummary, QuarterFigures } from '../../utils/kpi-performance';
import { ReportSave } from '../quarterly-report-form/quarterly-report-form';

/** One quarter of the selected year, scored */
interface QuarterRow extends QuarterFigures {
  label: string;
  assessment: Assessment;
}

/** One annual target row of the expanded card, with that year's result */
interface TargetRow {
  baselineYear: number;
  baselineValue: number | null;
  targetYear: number;
  targetValue: number;
  summary: YearSummary | null;
  assessment: Assessment | null;
  current: boolean;
}

/** Everything a card shows for the selected year, computed once per change rather than per template call */
interface Card {
  p: StrategicDeliverable;
  title: string;
  owner: string;
  baseline: { label: string; value: number | null } | null;
  summary: YearSummary | null;
  yearAssessment: Assessment | null;
  quarters: QuarterRow[];
  targets: TargetRow[];
  hasChart: boolean;
}

/** What the confirmation dialog is asking */
interface Confirmation {
  title: string;
  message: string;
  action: () => void;
}

/**
 * One deliverables page (presidential, ministerial or agency, by config): the list of cards for
 * the selected year with filters, the priority-areas tab, and the create/edit and quarterly
 * report forms. The forms are child components; the store does the saving.
 */
@Component({
  selector: 'app-deliverables-list',
  standalone: false,
  templateUrl: './deliverables-list.html',
  styleUrl: './deliverables-list.css',
})
export class DeliverablesList implements OnInit {
  store = inject(StrategicDeliverablesStore);
  config = inject(DELIVERABLES_CONFIG);
  private globalState = inject(GlobalStateService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly canEdit = inject(AuthService).isAdmin();

  year = this.globalState.selectedYear;
  activeTab = signal<'deliverables' | 'areas'>('deliverables');
  expandedId = signal<string | null>(null);
  searchText = signal('');

  /** Open create/edit form: null = new deliverable; undefined = closed */
  editing = signal<StrategicDeliverable | null | undefined>(undefined);
  /** Open report form */
  reporting = signal<{ deliverable: StrategicDeliverable; year?: number; quarter?: string } | null>(null);
  confirmation = signal<Confirmation | null>(null);

  /** Years referenced by the data, so the year picker offers them */
  dataYears = computed(() => this.store.deliverables().flatMap(p => KPI.getActiveYears(p)));

  /** Deliverables active in the selected year (before filters), by serial number */
  yearDeliverables = computed(() =>
    this.store.deliverables()
      .filter(p => KPI.isActiveInYear(p, this.year()))
      .sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0))
  );

  filtered = computed(() => {
    const area = this.store.filterPriorityArea().toLowerCase();
    const dept = this.store.filterDepartment().toLowerCase();
    const text = this.searchText().trim().toLowerCase();
    return this.yearDeliverables().filter(p =>
      (!area || (p.priorityArea || '').toLowerCase() === area)
      && (!dept || (p.responsibleDepartment || '').toLowerCase().includes(dept))
      && (!text || [p.outcome, p.deliverable, p.indicator].some(v => (v || '').toLowerCase().includes(text)))
    );
  });

  hasActiveFilter = computed(() =>
    !!this.store.filterPriorityArea() || !!this.store.filterDepartment() || !!this.searchText().trim()
  );

  cards = computed<Card[]>(() => this.filtered().map(p => this.cardFor(p, this.year())));

  /** Report form to open once deliverables load (from the details page's Edit button) */
  private pendingReportEdit = signal<{ id: string; year: number; quarter: string } | null>(null);

  constructor() {
    effect(() => {
      const pending = this.pendingReportEdit();
      const deliverable = pending && this.store.deliverables().find(p => p.id === pending.id);
      if (!pending || !deliverable) return;
      untracked(() => {
        this.pendingReportEdit.set(null);
        if (this.canEdit) this.openReport(deliverable, pending.year, pending.quarter);
      });
    });
  }

  ngOnInit(): void {
    this.store.ensureLoaded();

    // Returning from a report's details page: restore its year and expand its deliverable
    const params = this.route.snapshot.queryParamMap;
    const year = Number(params.get('year'));
    if (year) this.globalState.setYear(year);
    const expand = params.get('expand');
    if (expand) this.expandedId.set(expand);
    const editQuarter = params.get('editReport');
    if (expand && year && editQuarter) {
      this.pendingReportEdit.set({ id: expand, year, quarter: editQuarter.toUpperCase() });
    }
    // Drop the one-off params so a refresh doesn't reopen the form
    if (params.keys.length) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  private cardFor(p: StrategicDeliverable, year: number): Card {
    const summary = KPI.getYearSummary(p, year);
    return {
      p,
      title: KPI.deliverableTitle(p),
      owner: this.ownerLabel(p.responsibleDepartment),
      baseline: KPI.getBaselineForYear(p, year),
      summary,
      yearAssessment: summary ? KPI.assess(p, summary.actual, summary.target, year) : null,
      quarters: KPI.getQuarters(p, year).map(q => ({
        ...q, label: KPI.quarterLabel(q.key), assessment: KPI.assess(p, q.actual, q.target, year, true)
      })),
      targets: KPI.getAnnualTargets(p).map(t => {
        const s = KPI.getYearSummary(p, t.targetYear);
        return {
          baselineYear: t.baselineYear, baselineValue: t.baselineValue ?? null, targetYear: t.targetYear, targetValue: t.targetValue,
          summary: s, assessment: s ? KPI.assess(p, s.actual, t.targetValue, t.targetYear) : null, current: t.targetYear === year
        };
      }),
      hasChart: Object.keys(p.yearlyPerformance || {}).length > 0,
    };
  }

  /** Owner shown for a deliverable: a department, or "Organization-wide" where configured. */
  ownerLabel(department: string | undefined): string {
    const org = this.config.organizationWide;
    if (org && department === org.value) return 'Organization-wide';
    return department || '—';
  }

  aggregationLabel = KPI.getAggregationLabel;
  directionLabel = KPI.getDirectionLabel;
  categoryLabel = KPI.getCategoryLabel;

  // ── Filters and navigation ──

  clearFilters(): void {
    this.searchText.set('');
    this.store.setFilterPriorityArea('');
    this.store.setFilterDepartment('');
  }

  toggleExpand(id: string): void {
    this.expandedId.update(current => (current === id ? null : id));
  }

  /** Opens the details page for one quarterly report. */
  openReportDetails(p: StrategicDeliverable, quarterKey: string): void {
    this.router.navigate([p.id, 'reports', this.year(), quarterKey.toUpperCase()], { relativeTo: this.route });
  }

  /** Switch the page to the given year if it isn't already showing it. */
  private showYear(year: number): void {
    if (year !== this.year()) this.globalState.setYear(year);
  }

  // ── Deliverable form ──

  openNew(): void {
    this.store.clearError();
    this.editing.set(null);
  }

  openEdit(p: StrategicDeliverable): void {
    this.store.clearError();
    this.editing.set(p);
  }

  closeForm(): void {
    this.editing.set(undefined);
    this.store.clearError();
  }

  saveDeliverable(payload: Partial<StrategicDeliverable>): void {
    const existing = this.editing();
    const year = (payload.baselineYear ?? this.year() - 1) + 1;
    const onSuccess = () => {
      this.closeForm();
      // Show the KPI under the year it was registered for, not whatever year the page was on
      const switching = year !== this.year();
      this.showYear(year);
      this.toast.success(switching ? `Deliverable saved. Showing ${year}.` : 'Deliverable saved.');
    };
    if (existing) this.store.updateDeliverable({ id: existing.id, deliverable: payload, onSuccess });
    else this.store.createDeliverable({ deliverable: payload, onSuccess });
  }

  deleteDeliverable(p: StrategicDeliverable): void {
    this.confirmation.set({
      title: 'Delete deliverable',
      message: `Delete #${p.serialNumber} "${KPI.deliverableTitle(p)}" and all its quarterly reports? This cannot be undone.`,
      action: () => this.store.deleteDeliverable({ id: p.id, onSuccess: () => this.toast.success('Deliverable deleted.') })
    });
  }

  // ── Quarterly report form ──

  openReport(p: StrategicDeliverable, year?: number, quarter?: string): void {
    this.store.clearError();
    this.reporting.set({ deliverable: p, year, quarter });
  }

  closeReport(): void {
    this.reporting.set(null);
    this.store.clearError();
  }

  saveReport(e: ReportSave): void {
    const target = this.reporting();
    if (!target) return;
    const deliverableId = target.deliverable.id;
    const label = `${e.report.quarter} ${e.report.year}`;
    const onSuccess = () => {
      this.closeReport();
      this.showYear(e.report.year);
      this.expandedId.set(deliverableId);
      this.toast.success(`${label} report ${e.reportId ? 'updated' : 'submitted'}.`);
    };
    if (e.reportId) this.store.updateReport({ deliverableId, reportId: e.reportId, report: e.report, onSuccess });
    else this.store.createReport({ deliverableId, report: e.report, onSuccess });
  }

  deleteReport(e: { reportId: string; label: string }): void {
    const target = this.reporting();
    if (!target) return;
    const deliverableId = target.deliverable.id;
    this.confirmation.set({
      title: 'Delete quarterly report',
      message: `Delete the ${e.label} report? This cannot be undone.`,
      action: () => this.store.deleteReport({
        deliverableId, reportId: e.reportId,
        onSuccess: () => {
          this.closeReport();
          this.toast.success(`${e.label} report deleted.`);
        }
      })
    });
  }

  confirm(): void {
    const action = this.confirmation()?.action;
    this.confirmation.set(null);
    action?.();
  }
}
