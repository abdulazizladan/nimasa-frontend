import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { PresidentialPrioritiesStore } from '../../store/presidential-priorities.store';
import { PresidentialPriority, PresidentialPrioritiesService, AnnualTarget } from '../../services/presidential-priorities.service';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { Auth } from '../../../auth/services/auth';
import { Subscription } from 'rxjs';

/** Roles allowed to create, edit and delete (mirrors the backend @Roles guards). */
const EDITOR_ROLES = ['admin', 'director', 'manager'];

/** Fields of a priority the user can edit; everything else (id, timestamps, yearlyPerformance) is server-owned. */
const EDITABLE_FIELDS: (keyof PresidentialPriority)[] = [
  'serialNumber', 'ministry', 'priorityArea', 'outcome', 'deliverable', 'baselineType', 'indicator',
  'baselineYear', 'baseline2023', 'projections', 'annualTargets', 'responsibleDepartment', 'supportingEvidence', 'category'
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

interface YearSummary {
  actual: number | null;
  target: number | null;
  /** How actual was derived from the quarterly figures */
  basis: 'latest quarter' | 'sum of quarters' | 'annual';
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

  // Quarterly Report Modal State
  showReportModal = false;
  selectedPriorityId = '';
  reportYearOptions: number[] = [];
  /** Set when editing an existing report rather than creating one */
  editingReportId: string | null = null;
  loadingReport = false;
  newReport = this.getEmptyReport(new Date().getFullYear());

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
  getQuarters(p: PresidentialPriority, year: string): { key: string; target: number; actual: number }[] {
    const perf = p.yearlyPerformance?.[year] || {};
    return QUARTER_KEYS.filter(k => perf[k]).map(k => ({ key: k, target: perf[k].target, actual: perf[k].actual }));
  }

  /**
   * Year-to-date result against the annual target. Percentage/rate KPIs use the latest
   * reported quarter; count KPIs add the quarters up. An explicit "annual" entry wins.
   */
  getYearSummary(p: PresidentialPriority, year: string): YearSummary | null {
    const target = this.getAnnualTarget(p, year);
    const annual = p.yearlyPerformance?.[year]?.annual;
    if (annual && annual.actual !== undefined) {
      return { actual: annual.actual, target: target ?? annual.target ?? null, basis: 'annual' };
    }
    const quarters = this.getQuarters(p, year);
    if (quarters.length === 0) {
      return target === null ? null : { actual: null, target, basis: 'sum of quarters' };
    }
    if (this.isRateKpi(p)) {
      return { actual: quarters[quarters.length - 1].actual, target, basis: 'latest quarter' };
    }
    return { actual: quarters.reduce((sum, q) => sum + (Number(q.actual) || 0), 0), target, basis: 'sum of quarters' };
  }

  private isRateKpi(p: PresidentialPriority): boolean {
    return /percent|%|rate|ratio|index|score/i.test(`${p.baselineType} ${p.indicator}`);
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
      category: 'PRESIDENTIAL_PRIORITY'
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
      this.formError = 'Please fill in all required fields (Priority Area, KPI/Indicator, Department).';
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
        this.showSuccess(`Priority saved successfully. Showing ${year}.`);
      } else {
        this.showSuccess('Priority saved successfully.');
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

  private getEmptyReport(year: number) {
    return {
      year,
      quarter: 'Q1',
      targetValue: undefined as number | undefined,
      actualValue: undefined as number | undefined,
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
    this.reportYearOptions = [];
    for (let y = reportYear; y <= lastYear; y++) this.reportYearOptions.push(y);
    return reportYear;
  }

  /** First quarter not yet reported for the year, so the form doesn't default to a duplicate. */
  private nextOpenQuarter(p: PresidentialPriority, year: number): string {
    const perf = p.yearlyPerformance?.[year.toString()] || {};
    const open = QUARTER_KEYS.find(k => !perf[k]);
    return (open || 'q1').toUpperCase();
  }

  openReportModal(p: PresidentialPriority): void {
    this.selectedPriorityId = p.id;
    this.editingReportId = null;
    const reportYear = this.buildReportYearOptions(p);

    // Default to the year being viewed when it applies to this KPI, otherwise the KPI's own report year
    const viewed = parseInt(this.globalYear(), 10);
    const defaultYear = this.reportYearOptions.includes(viewed) ? viewed : reportYear;

    this.newReport = this.getEmptyReport(defaultYear);
    this.newReport.quarter = this.nextOpenQuarter(p, defaultYear);
    this.newReport.targetValue = this.suggestedQuarterTarget(p, defaultYear);
    this.formError = '';
    this.store.clearError();
    this.showReportModal = true;
  }

  /** For count KPIs, suggest a quarter's share of the annual target; for rate KPIs, the annual target itself. */
  private suggestedQuarterTarget(p: PresidentialPriority, year: number): number | undefined {
    const annual = this.getAnnualTarget(p, year);
    if (annual === null) return undefined;
    return this.isRateKpi(p) ? annual : Math.round((annual / 4) * 100) / 100;
  }

  /** Opens an existing quarterly report for editing. */
  editReport(p: PresidentialPriority, year: string, quarterKey: string): void {
    this.selectedPriorityId = p.id;
    this.buildReportYearOptions(p);
    const quarter = quarterKey.toUpperCase();
    this.loadingReport = true;
    this.formError = '';
    this.store.clearError();

    this.service.getSubmissions(p.id, Number(year), quarter).subscribe({
      next: (reports) => {
        this.loadingReport = false;
        const report = reports.find(r => r.year === Number(year) && r.quarter === quarter);
        if (!report) {
          this.store.setError(`Could not find the ${quarter} ${year} report to edit.`);
          return;
        }
        this.editingReportId = report.id;
        if (!this.reportYearOptions.includes(report.year)) {
          this.reportYearOptions = [...this.reportYearOptions, report.year].sort((a, b) => a - b);
        }
        this.newReport = {
          year: report.year,
          quarter: report.quarter,
          targetValue: report.targetValue ?? undefined,
          actualValue: report.actualValue ?? undefined,
          progress: report.progress || '',
          keyIssues: report.keyIssues || '',
          mdaEfforts: report.mdaEfforts || '',
          comments: report.comments || ''
        };
        this.showReportModal = true;
      },
      error: (err) => {
        this.loadingReport = false;
        this.store.setError(err.error?.message || 'Failed to load quarterly report.');
      }
    });
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.editingReportId = null;
    this.formError = '';
    this.store.clearError();
  }

  submitReport(): void {
    const target = this.newReport.targetValue as any;
    const actual = this.newReport.actualValue as any;
    if (target === undefined || target === null || target === '' || actual === undefined || actual === null || actual === '') {
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
    this.newPriority = { ...priority };
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
      title: 'Delete Priority',
      message: `Are you sure you want to delete #${p.serialNumber} "${p.outcome || p.indicator}" and all its quarterly reports?`,
      action: () => this.store.deletePriority({
        id: p.id,
        onSuccess: () => this.showSuccess('Priority deleted successfully.')
      })
    };
  }

  confirmAction(): void {
    const action = this.confirmDialog?.action;
    this.confirmDialog = null;
    action?.();
  }
}
