import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { PresidentialPrioritiesStore } from '../../store/presidential-priorities.store';
import {
  PresidentialPriority, PresidentialPrioritiesService, AnnualTarget, AnnualAggregation, QuarterlyReport
} from '../../services/presidential-priorities.service';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { Auth } from '../../../auth/services/auth';
import { Subscription } from 'rxjs';

/** Roles allowed to create, edit and delete (mirrors the backend @Roles guards). */
const EDITOR_ROLES = ['admin', 'director', 'manager'];

/** Fields of a priority the user can edit; everything else (id, timestamps, yearlyPerformance) is server-owned. */
const EDITABLE_FIELDS: (keyof PresidentialPriority)[] = [
  'serialNumber', 'ministry', 'priorityArea', 'outcome', 'deliverable', 'baselineType', 'indicator',
  'baselineYear', 'baseline2023', 'projections', 'annualTargets', 'annualAggregation', 'responsibleDepartment',
  'supportingEvidence', 'category'
];

/** One editable annual target row in the create/edit form (inputs may be empty while typing). */
interface AnnualTargetRow {
  baselineYear: number | null;
  baselineValue: number | null;
  targetYear: number | null;
  targetValue: number | null;
}

const isBlank = (v: any) => v === null || v === undefined || v === '';

const QUARTER_KEYS = ['q1', 'q2', 'q3', 'q4'];

export const AGGREGATION_LABELS: Record<AnnualAggregation, string> = {
  sum: 'Sum of quarters',
  average: 'Average of quarters',
  latest: 'Latest quarter'
};

interface YearSummary {
  actual: number | null;
  target: number | null;
  /** Quarters that make up the actual, e.g. "Q1–Q2" */
  quarters: string;
  method: AnnualAggregation;
}

interface ReportForm {
  year: number;
  quarter: string;
  targetValue: number | undefined;
  actualValue: number | undefined;
  progress: string;
  keyIssues: string;
  mdaEfforts: string;
  comments: string;
}

@Component({
  selector: 'app-presidential-priorities-list',
  standalone: false,
  templateUrl: './presidential-priorities-list.html',
  styleUrl: './presidential-priorities-list.css',
})
export class PresidentialPrioritiesList implements OnInit, OnDestroy {
  store = inject(PresidentialPrioritiesStore);
  private service = inject(PresidentialPrioritiesService);
  private globalState = inject(GlobalStateService);
  private auth = inject(Auth);

  searchPriorityArea = '';
  searchDepartment = '';
  activeTab: 'priorities' | 'areas' = 'priorities';
  expandedId: string | null = null;
  globalYear = signal(new Date().getFullYear().toString());
  canEdit = EDITOR_ROLES.includes(this.auth.getUser()?.role);
  private sub?: Subscription;

  // Available years: from 2023 up to next year, extended by any year referenced in the data
  years = computed(() => {
    const set = new Set<number>();
    const next = new Date().getFullYear() + 1;
    for (let y = 2023; y <= next; y++) set.add(y);
    for (const p of this.store.priorities()) {
      this.getActiveYears(p).forEach(y => set.add(y));
    }
    set.add(parseInt(this.globalYear(), 10));
    return [...set].sort((a, b) => a - b).map(String);
  });

  // Add modal state variables
  showAddModal = false;
  showAddAreaModal = false;
  newAreaName = '';
  isEditingArea = false;
  editingAreaId = '';
  newPriority: Partial<PresidentialPriority> = this.getEmptyForm();
  currentYearDisplay: number = new Date().getFullYear();
  annualTargets: AnnualTargetRow[] = [];
  /** Client-side validation message shown inside the open modal */
  formError = '';

  aggregationOptions = Object.entries(AGGREGATION_LABELS) as [AnnualAggregation, string][];

  // Quarterly Report Modal State
  showReportModal = false;
  selectedPriorityId = '';
  private reportPriority: PresidentialPriority | null = null;
  reportYearOptions: number[] = [];
  readonly quarterOptions = ['Q1', 'Q2', 'Q3', 'Q4'];
  /** Set when the selected year/quarter already has a saved report (the form then updates it) */
  editingReportId: string | null = null;
  loadingReport = false;
  newReport: ReportForm = this.getEmptyReport(new Date().getFullYear());
  /** Saved reports for the KPI being reported on */
  private periodReports: QuarterlyReport[] = [];
  /** Unsaved entries per "year-quarter", kept while switching periods in the open form */
  private reportDrafts: Record<string, ReportForm> = {};
  private reportPeriodKey = '';

  showSuccessModal = false;
  successMessage = '';

  /** In-page confirmation dialog (replaces window.confirm) */
  confirmDialog: { title: string; message: string; action: () => void } | null = null;

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => {
      this.showSuccessModal = false;
    }, 5000);
  }

  /** Priorities active in the selected year (before department/area filters), sorted by serial number. */
  yearPriorities = computed(() => {
    const selectedYearNum = parseInt(this.globalYear(), 10);
    return this.store.priorities()
      .filter(p => this.isActiveInYear(p, selectedYearNum))
      .sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0));
  });

  filteredPriorities = computed(() => {
    const area = this.store.filterPriorityArea().toLowerCase();
    const dept = this.store.filterDepartment().toLowerCase();

    return this.yearPriorities().filter(p => {
      const matchArea = !area || (p.priorityArea || '').toLowerCase().includes(area);
      const matchDept = !dept || (p.responsibleDepartment || '').toLowerCase().includes(dept);
      return matchArea && matchDept;
    });
  });

  hasActiveFilter = computed(() =>
    !!this.store.filterPriorityArea() || !!this.store.filterDepartment()
  );

  /** The year the KPI was registered for (the "Current Year" entered on creation). */
  getReportYear(p: Partial<PresidentialPriority>): number | null {
    return p.baselineYear ? Number(p.baselineYear) + 1 : null;
  }

  /** Years a KPI is active in: its report year, any year with an annual target, and any year with reports. */
  getActiveYears(p: PresidentialPriority): number[] {
    const years = new Set<number>();
    const reportYear = this.getReportYear(p);
    if (reportYear) years.add(reportYear);
    Object.keys(p.projections || {}).forEach(y => years.add(Number(y)));
    (p.annualTargets || []).forEach(t => years.add(Number(t.targetYear)));
    Object.keys(p.yearlyPerformance || {}).forEach(y => years.add(Number(y)));
    return [...years].filter(y => !isNaN(y)).sort((a, b) => a - b);
  }

  isActiveInYear(p: PresidentialPriority, year: number): boolean {
    const active = this.getActiveYears(p);
    return active.length === 0 || active.includes(year);
  }

  getAnnualTarget(p: PresidentialPriority, year: string | number): number | null {
    const target = (p.annualTargets || []).find(t => Number(t.targetYear) === Number(year));
    if (target) return target.targetValue;
    const value = p.projections?.[year.toString()];
    return value === undefined || value === null ? null : value;
  }

  /** Annual targets for display; older records that only have projections get their baseline inferred where possible. */
  getAnnualTargets(p: PresidentialPriority): AnnualTarget[] {
    if (p.annualTargets?.length) {
      return [...p.annualTargets].sort((a, b) => a.targetYear - b.targetYear);
    }
    return Object.entries(p.projections || {})
      .map(([year, value]) => {
        const targetYear = Number(year);
        const baselineYear = targetYear - 1;
        return {
          baselineYear,
          baselineValue: baselineYear === p.baselineYear ? p.baseline2023 ?? null : null,
          targetYear,
          targetValue: value
        };
      })
      .sort((a, b) => a.targetYear - b.targetYear);
  }

  /** Quarter entries (q1..q4) reported for a year, in quarter order. */
  getQuarters(p: PresidentialPriority, year: string | number): { key: string; target: number; actual: number }[] {
    const perf = p.yearlyPerformance?.[year.toString()] || {};
    return QUARTER_KEYS.filter(k => perf[k]).map(k => ({ key: k, target: perf[k].target, actual: perf[k].actual }));
  }

  getAggregation(p: Partial<PresidentialPriority>): AnnualAggregation {
    return p.annualAggregation || 'sum';
  }

  getAggregationLabel(p: Partial<PresidentialPriority>): string {
    return AGGREGATION_LABELS[this.getAggregation(p)];
  }

  /** Combines quarterly values into an annual figure using the KPI's method (mirrors the backend). */
  private combine(method: AnnualAggregation, values: number[]): number {
    if (method === 'latest') return values[values.length - 1];
    const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
    return method === 'average' ? Math.round((total / values.length) * 100) / 100 : total;
  }

  /**
   * The year's result built from its quarterly reports, against the annual target
   * (or, when no annual target is set, the quarterly targets combined the same way).
   */
  getYearSummary(p: PresidentialPriority, year: string | number): YearSummary | null {
    const method = this.getAggregation(p);
    const target = this.getAnnualTarget(p, year);
    const quarters = this.getQuarters(p, year);
    if (quarters.length === 0) {
      return target === null ? null : { actual: null, target, quarters: '', method };
    }
    const first = quarters[0].key.toUpperCase();
    const last = quarters[quarters.length - 1].key.toUpperCase();
    return {
      actual: this.combine(method, quarters.map(q => q.actual)),
      target: target ?? this.combine(method, quarters.map(q => q.target)),
      quarters: first === last ? first : `${first}–${last}`,
      method
    };
  }

  /**
   * Baseline that applies to the selected year: the annual target row for that year, else the
   * previous year's actual, else the KPI's original baseline if it was measured the year before.
   */
  getBaselineForYear(p: PresidentialPriority, year: string | number): { label: string; value: number | null } | null {
    const y = Number(year);
    const row = this.getAnnualTargets(p).find(t => t.targetYear === y);
    if (row && row.baselineValue !== null && row.baselineValue !== undefined) {
      return { label: `${row.baselineYear}`, value: row.baselineValue };
    }
    const previousActual = this.getYearSummary(p, y - 1)?.actual;
    if (previousActual !== null && previousActual !== undefined) {
      return { label: `${y - 1} actual`, value: previousActual };
    }
    if (p.baselineYear === y - 1 && p.baseline2023 !== null && p.baseline2023 !== undefined) {
      return { label: `${p.baselineYear}`, value: p.baseline2023 };
    }
    return row ? { label: `${row.baselineYear}`, value: null } : null;
  }

  getCategoryLabel(category: string): string {
    return category === 'BOTH' ? 'Ministerial and Presidential' : 'Presidential';
  }

  ngOnInit(): void {
    this.store.loadPriorities();
    this.store.loadPriorityAreas();
    this.store.loadDepartments();

    this.sub = this.globalState.selectedYear$.subscribe(year => {
      this.globalYear.set(year.toString());
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  onGlobalYearChange(year: string): void {
    this.globalState.setYear(parseInt(year, 10));
  }

  onCurrentYearChange(year: number): void {
    const previous = this.currentYearDisplay;
    this.currentYearDisplay = year;
    this.newPriority.baselineYear = year - 1;
    // Keep the first annual target row in step with the current year if the user hasn't changed its years
    const first = this.annualTargets[0];
    if (first && first.targetYear === previous && first.baselineYear === previous - 1) {
      first.targetYear = year;
      first.baselineYear = year - 1;
    }
  }

  private newTargetRow(targetYear: number, baselineValue: number | null = null): AnnualTargetRow {
    return { baselineYear: targetYear - 1, baselineValue, targetYear, targetValue: null };
  }

  /** Adds the next year's target; its baseline year defaults to the previous row's target year. */
  addAnnualTargetRow(): void {
    const used = this.annualTargets.map(t => Number(t.targetYear)).filter(y => !isNaN(y) && y > 0);
    const nextYear = used.length ? Math.max(...used) + 1 : this.currentYearDisplay;
    this.annualTargets.push(this.newTargetRow(nextYear));
  }

  removeAnnualTargetRow(index: number): void {
    this.annualTargets.splice(index, 1);
  }

  /** Rows the user has filled in (a row with neither a baseline nor a target value is ignored). */
  private filledTargetRows(): AnnualTargetRow[] {
    return this.annualTargets.filter(t => !isBlank(t.targetValue) || !isBlank(t.baselineValue));
  }

  private rowsToAnnualTargets(): AnnualTarget[] {
    return this.filledTargetRows()
      .map(t => ({
        baselineYear: Number(t.baselineYear),
        baselineValue: isBlank(t.baselineValue) ? null : Number(t.baselineValue),
        targetYear: Number(t.targetYear),
        targetValue: Number(t.targetValue)
      }))
      .sort((a, b) => a.targetYear - b.targetYear);
  }

  /** Returns an error message for the first invalid annual target row, or '' if all are valid. */
  private validateTargetRows(currentYear: number): string {
    const seen = new Set<number>();
    for (const t of this.filledTargetRows()) {
      const baselineYear = Number(t.baselineYear);
      const targetYear = Number(t.targetYear);
      if (isBlank(t.baselineYear) || isBlank(t.targetYear) || isBlank(t.targetValue)) {
        return 'Each annual target needs a Baseline Year, Target Year and Target Value.';
      }
      if (targetYear < currentYear) {
        return `Target year ${targetYear} must be ${currentYear} or later.`;
      }
      if (targetYear <= baselineYear) {
        return `Target year ${targetYear} must be after its baseline year ${baselineYear}.`;
      }
      if (seen.has(targetYear)) {
        return `Only one annual target is allowed for ${targetYear}.`;
      }
      seen.add(targetYear);
    }
    return '';
  }

  /** Switch the page to the given year if it isn't already showing it. */
  private showYear(year: number | null): void {
    if (year && year.toString() !== this.globalYear()) {
      this.globalState.setYear(year);
    }
  }

  onPriorityAreaChange(area: string): void {
    this.searchPriorityArea = area;
    this.store.setFilterPriorityArea(area);
  }

  onDepartmentChange(name: string): void {
    this.searchDepartment = name;
    this.store.setFilterDepartment(name);
  }

  clearFilters(): void {
    this.searchPriorityArea = '';
    this.searchDepartment = '';
    this.store.setFilterPriorityArea('');
    this.store.setFilterDepartment('');
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getStatusClass(actual: number | null, target: number | null): string {
    if (!target || actual === null) return 'status-na';
    const pct = (actual / target) * 100;
    if (pct >= 90) return 'status-on-track';
    if (pct >= 60) return 'status-at-risk';
    return 'status-off-track';
  }

  getStatusLabel(actual: number | null, target: number | null): string {
    if (!target || actual === null) return 'N/A';
    const pct = (actual / target) * 100;
    if (pct >= 90) return 'On Track';
    if (pct >= 60) return 'At Risk';
    return 'Off Track';
  }

  getProgressWidth(actual: number | null, target: number | null): number {
    if (!target || actual === null) return 0;
    return Math.min(100, Math.max(0, (actual / target) * 100));
  }

  /** Next free serial number (max + 1, so deletions don't cause duplicates). */
  private nextSerialNumber(): number {
    const serials = this.store.priorities().map(p => Number(p.serialNumber) || 0);
    return serials.length ? Math.max(...serials) + 1 : 1;
  }

  getEmptyForm(): Partial<PresidentialPriority> {
    return {
      serialNumber: this.nextSerialNumber(),
      ministry: 'NIMASA',
      priorityArea: '',
      outcome: '',
      deliverable: '',
      baselineType: 'Percentage',
      indicator: '',
      baselineYear: new Date().getFullYear() - 1, // Auto-fill Baseline from previous year
      baseline2023: undefined,
      responsibleDepartment: '',
      supportingEvidence: '',
      category: 'PRESIDENTIAL_PRIORITY',
      annualAggregation: 'sum'
    };
  }

  openAddModal(): void {
    this.newPriority = this.getEmptyForm();
    this.currentYearDisplay = new Date().getFullYear();
    this.annualTargets = [this.newTargetRow(this.currentYearDisplay)];
    this.formError = '';
    this.store.clearError();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.formError = '';
    this.store.clearError();
  }

  /** Builds the request body from the form, sending only editable fields with the right types. */
  private buildPriorityPayload(): Partial<PresidentialPriority> {
    const payload: Partial<PresidentialPriority> = {};
    for (const key of EDITABLE_FIELDS) {
      const value = this.newPriority[key];
      if (value !== undefined) (payload as any)[key] = value;
    }
    payload.serialNumber = Number(payload.serialNumber);
    payload.baselineYear = Number(this.currentYearDisplay) - 1;
    payload.annualTargets = this.rowsToAnnualTargets();
    payload.projections = Object.fromEntries(payload.annualTargets.map(t => [t.targetYear.toString(), t.targetValue]));
    // The KPI-level baseline is the one measured in the year before the report year (else the earliest given)
    const baselineTarget = payload.annualTargets.find(t => t.baselineYear === payload.baselineYear)
      ?? payload.annualTargets.find(t => t.baselineValue !== null);
    if (baselineTarget && baselineTarget.baselineValue !== null && baselineTarget.baselineValue !== undefined) {
      payload.baseline2023 = baselineTarget.baselineValue;
    }
    // Required strings on the backend; send empty strings rather than nulls
    payload.outcome = payload.outcome ?? '';
    payload.deliverable = payload.deliverable ?? '';
    payload.supportingEvidence = payload.supportingEvidence ?? '';
    return payload;
  }

  submitAdd(): void {
    const year = Number(this.currentYearDisplay);
    if (!this.newPriority.priorityArea || !this.newPriority.indicator || !this.newPriority.responsibleDepartment) {
      this.formError = 'Please fill in all required fields (Strategic Priority Area, KPI/Indicator, Department).';
      return;
    }
    if (!year || year < 2000 || year > 2100) {
      this.formError = 'Please enter a valid Current Year.';
      return;
    }
    const targetError = this.validateTargetRows(year);
    if (targetError) {
      this.formError = targetError;
      return;
    }
    this.formError = '';

    const payload = this.buildPriorityPayload();
    const onSuccess = () => {
      this.closeAddModal();
      // Show the KPI under the year it was registered for, not whatever year the page was on
      if (year.toString() !== this.globalYear()) {
        this.showYear(year);
        this.showSuccess(`Deliverable saved successfully. Showing ${year}.`);
      } else {
        this.showSuccess('Deliverable saved successfully.');
      }
    };

    if (this.newPriority.id) {
      this.store.updatePriority({ id: this.newPriority.id, priority: payload, onSuccess });
    } else {
      this.store.createPriority({ priority: payload, onSuccess });
    }
  }

  openAddAreaModal(): void {
    this.newAreaName = '';
    this.isEditingArea = false;
    this.editingAreaId = '';
    this.formError = '';
    this.store.clearError();
    this.showAddAreaModal = true;
  }

  editArea(area: any): void {
    this.newAreaName = area.name;
    this.isEditingArea = true;
    this.editingAreaId = area.id;
    this.formError = '';
    this.store.clearError();
    this.showAddAreaModal = true;
  }

  deleteArea(area: { id: string; name: string }): void {
    this.confirmDialog = {
      title: 'Delete Priority Area',
      message: `Are you sure you want to delete "${area.name}"?`,
      action: () => this.store.deletePriorityArea({
        id: area.id,
        onSuccess: () => this.showSuccess('Priority Area deleted successfully.')
      })
    };
  }

  closeAddAreaModal(): void {
    this.showAddAreaModal = false;
    this.formError = '';
    this.store.clearError();
  }

  submitAddArea(): void {
    const name = this.newAreaName.trim();
    if (!name) {
      this.formError = 'Please enter a valid Priority Area name.';
      return;
    }
    this.formError = '';

    const editing = this.isEditingArea && !!this.editingAreaId;
    const onSuccess = () => {
      this.closeAddAreaModal();
      this.showSuccess(editing ? 'Priority Area updated successfully.' : 'Priority Area created successfully.');
    };
    if (editing) {
      this.store.updatePriorityArea({ id: this.editingAreaId, name, onSuccess });
    } else {
      this.store.createPriorityArea({ name, onSuccess });
    }
  }

  private getEmptyReport(year: number, quarter = 'Q1'): ReportForm {
    return {
      year,
      quarter,
      targetValue: undefined,
      actualValue: undefined,
      progress: '',
      keyIssues: '',
      mdaEfforts: '',
      comments: ''
    };
  }

  /** Report years run from the KPI's report year to the latest target year (or next year). */
  private buildReportYearOptions(p: PresidentialPriority): number {
    const reportYear = this.getReportYear(p) ?? parseInt(this.globalYear(), 10);
    const lastYear = Math.max(new Date().getFullYear() + 1, ...this.getActiveYears(p));
    const first = Math.min(reportYear, ...this.getActiveYears(p));
    this.reportYearOptions = [];
    for (let y = first; y <= lastYear; y++) this.reportYearOptions.push(y);
    return reportYear;
  }

  /** First quarter not yet reported for the year, so the form doesn't default to a duplicate. */
  private nextOpenQuarter(p: PresidentialPriority, year: number): string {
    const perf = p.yearlyPerformance?.[year.toString()] || {};
    const open = QUARTER_KEYS.find(k => !perf[k]);
    return (open || 'q1').toUpperCase();
  }

  /** Whether a report has been saved for this year and quarter of the KPI being reported on. */
  hasReport(year: number, quarter: string): boolean {
    return !!this.reportPriority?.yearlyPerformance?.[year.toString()]?.[quarter.toLowerCase()];
  }

  /**
   * Opens the quarterly report form. The form follows the selected year and quarter: it shows the
   * saved report for that period (and updates it on save) or a blank entry for a new one.
   */
  openReportModal(p: PresidentialPriority, year?: number, quarter?: string): void {
    this.reportPriority = p;
    this.selectedPriorityId = p.id;
    const reportYear = this.buildReportYearOptions(p);

    // Default to the year being viewed when it applies to this KPI, otherwise the KPI's own report year
    const viewed = parseInt(this.globalYear(), 10);
    const startYear = year ?? (this.reportYearOptions.includes(viewed) ? viewed : reportYear);
    if (!this.reportYearOptions.includes(startYear)) {
      this.reportYearOptions = [...this.reportYearOptions, startYear].sort((a, b) => a - b);
    }

    this.periodReports = [];
    this.reportDrafts = {};
    this.newReport = this.getEmptyReport(startYear, quarter ?? this.nextOpenQuarter(p, startYear));
    this.reportPeriodKey = this.periodKey(this.newReport);
    this.loadReportPeriod();
    this.formError = '';
    this.store.clearError();
    this.showReportModal = true;

    // Load the saved reports so each period shows its full entry (comments, issues, etc.)
    this.loadingReport = true;
    this.service.getSubmissions(p.id).subscribe({
      next: (reports) => {
        this.loadingReport = false;
        this.periodReports = reports || [];
        this.loadReportPeriod();
      },
      error: (err) => {
        this.loadingReport = false;
        this.formError = err.error?.message || 'Could not load saved reports; showing summary figures only.';
      }
    });
  }

  private periodKey(r: { year: number; quarter: string }): string {
    return `${r.year}-${r.quarter}`;
  }

  /** Called when the Year or Quarter changes: keep what was typed, then show the newly selected period. */
  onReportPeriodChange(field: 'year' | 'quarter', value: number | string): void {
    this.reportDrafts[this.reportPeriodKey] = { ...this.newReport };
    this.newReport = { ...this.newReport, [field]: field === 'year' ? Number(value) : value };
    this.reportPeriodKey = this.periodKey(this.newReport);
    this.loadReportPeriod();
  }

  /** Fills the form for the selected period: unsaved draft, else saved report, else a new entry. */
  private loadReportPeriod(): void {
    const p = this.reportPriority;
    if (!p) return;
    const { year, quarter } = this.newReport;
    const saved = this.periodReports.find(r => Number(r.year) === Number(year) && r.quarter === quarter);
    this.editingReportId = saved?.id ?? null;

    const draft = this.reportDrafts[this.periodKey(this.newReport)];
    if (draft) {
      this.newReport = { ...draft };
      return;
    }
    if (saved) {
      this.newReport = {
        year,
        quarter,
        targetValue: saved.targetValue ?? undefined,
        actualValue: saved.actualValue ?? undefined,
        progress: saved.progress || '',
        keyIssues: saved.keyIssues || '',
        mdaEfforts: saved.mdaEfforts || '',
        comments: saved.comments || ''
      };
      return;
    }
    // Figures recorded without a full report (older data): show them so they aren't re-entered blind
    const summary = p.yearlyPerformance?.[year.toString()]?.[quarter.toLowerCase()];
    this.newReport = {
      ...this.getEmptyReport(year, quarter),
      targetValue: summary?.target ?? this.suggestedQuarterTarget(p, year),
      actualValue: summary?.actual ?? undefined
    };
  }

  /** Suggests a quarterly target from the annual target: a quarter's share when summed, else the target itself. */
  private suggestedQuarterTarget(p: PresidentialPriority, year: number): number | undefined {
    const annual = this.getAnnualTarget(p, year);
    if (annual === null) return undefined;
    return this.getAggregation(p) === 'sum' ? Math.round((annual / 4) * 100) / 100 : annual;
  }

  /** Opens the report form on an existing quarter. */
  editReport(p: PresidentialPriority, year: string, quarterKey: string): void {
    this.openReportModal(p, Number(year), quarterKey.toUpperCase());
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.editingReportId = null;
    this.reportPriority = null;
    this.periodReports = [];
    this.reportDrafts = {};
    this.formError = '';
    this.store.clearError();
  }

  submitReport(): void {
    const target = this.newReport.targetValue as any;
    const actual = this.newReport.actualValue as any;
    if (isBlank(target) || isBlank(actual)) {
      this.formError = 'Please fill in required Target and Actual values.';
      return;
    }
    this.formError = '';

    const payload = {
      ...this.newReport,
      year: Number(this.newReport.year),
      targetValue: Number(target),
      actualValue: Number(actual)
    };
    const priorityId = this.selectedPriorityId;
    const editing = !!this.editingReportId;
    const onSuccess = () => {
      this.closeReportModal();
      this.showYear(payload.year);
      this.expandedId = priorityId;
      this.showSuccess(`${payload.quarter} ${payload.year} report ${editing ? 'updated' : 'submitted'} successfully.`);
    };

    if (this.editingReportId) {
      this.store.updateSubmission({ reportId: this.editingReportId, submission: payload, onSuccess });
    } else {
      this.store.createSubmission({ id: priorityId, submission: payload, onSuccess });
    }
  }

  deleteReport(): void {
    const reportId = this.editingReportId;
    if (!reportId) return;
    const label = `${this.newReport.quarter} ${this.newReport.year}`;
    this.confirmDialog = {
      title: 'Delete Quarterly Report',
      message: `Are you sure you want to delete the ${label} report? This cannot be undone.`,
      action: () => this.store.deleteSubmission({
        reportId,
        onSuccess: () => {
          this.closeReportModal();
          this.showSuccess(`${label} report deleted successfully.`);
        }
      })
    };
  }

  editPriority(priority: PresidentialPriority): void {
    this.newPriority = { ...priority, annualAggregation: this.getAggregation(priority) };
    this.currentYearDisplay = priority.baselineYear ? priority.baselineYear + 1 : new Date().getFullYear();
    this.annualTargets = this.getAnnualTargets(priority).map(t => ({
      baselineYear: t.baselineYear,
      baselineValue: t.baselineValue ?? null,
      targetYear: t.targetYear,
      targetValue: t.targetValue
    }));
    if (this.annualTargets.length === 0) {
      this.annualTargets = [this.newTargetRow(this.currentYearDisplay, priority.baseline2023 ?? null)];
    }
    this.formError = '';
    this.store.clearError();
    this.showAddModal = true;
  }

  deletePriority(p: PresidentialPriority): void {
    this.confirmDialog = {
      title: 'Delete Deliverable',
      message: `Are you sure you want to delete #${p.serialNumber} "${p.outcome || p.indicator}" and all its quarterly reports?`,
      action: () => this.store.deletePriority({
        id: p.id,
        onSuccess: () => this.showSuccess('Deliverable deleted successfully.')
      })
    };
  }

  confirmAction(): void {
    const action = this.confirmDialog?.action;
    this.confirmDialog = null;
    action?.();
  }
}
