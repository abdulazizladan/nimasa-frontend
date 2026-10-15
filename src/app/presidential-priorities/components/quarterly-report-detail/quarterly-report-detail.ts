import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  PresidentialPriority, PresidentialPrioritiesService, QuarterlyReport
} from '../../services/presidential-priorities.service';
import { Auth } from '../../../auth/services/auth';
import * as KPI from '../../utils/kpi-performance';

/** Roles allowed to edit reports (mirrors the backend @Roles guards). */
const EDITOR_ROLES = ['admin', 'director', 'manager'];

/** Details page for one quarterly report of a presidential deliverable: /:id/reports/:year/:quarter */
@Component({
  selector: 'app-quarterly-report-detail',
  standalone: false,
  templateUrl: './quarterly-report-detail.html',
  styleUrl: './quarterly-report-detail.css',
})
export class QuarterlyReportDetail implements OnInit, OnDestroy {
  private service = inject(PresidentialPrioritiesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private sub?: Subscription;

  canEdit = EDITOR_ROLES.includes(this.auth.getUser()?.role);
  readonly quarterOptions = ['Q1', 'Q2', 'Q3', 'Q4'];

  priority = signal<PresidentialPriority | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  year = signal(0);
  quarter = signal('Q1');

  // Shared performance helpers
  assess = KPI.assess;
  getAggregationLabel = KPI.getAggregationLabel;
  getDirectionLabel = KPI.getDirectionLabel;
  getCategoryLabel = KPI.getCategoryLabel;

  /** The full saved report for this period, if one exists. */
  report = computed<QuarterlyReport | null>(() => {
    const p = this.priority();
    return p?.monthlySubmissions?.find(r => Number(r.year) === this.year() && r.quarter === this.quarter()) ?? null;
  });

  /** Target/actual for this period: from the report, or from summary figures saved without a full report. */
  figures = computed<{ target: number | null; actual: number | null } | null>(() => {
    const report = this.report();
    if (report) return { target: report.targetValue ?? null, actual: report.actualValue ?? null };
    const summary = this.priority()?.yearlyPerformance?.[this.year().toString()]?.[this.quarter().toLowerCase()];
    return summary ? { target: summary.target ?? null, actual: summary.actual ?? null } : null;
  });

  quarterAssessment = computed(() => {
    const p = this.priority();
    const f = this.figures();
    return p && f ? KPI.assess(p, f.actual, f.target, this.year(), true) : null;
  });

  yearSummary = computed(() => {
    const p = this.priority();
    return p ? KPI.getYearSummary(p, this.year()) : null;
  });

  yearAssessment = computed(() => {
    const p = this.priority();
    const s = this.yearSummary();
    return p && s ? KPI.assess(p, s.actual, s.target, this.year()) : null;
  });

  baseline = computed(() => {
    const p = this.priority();
    return p ? KPI.getBaselineForYear(p, this.year()) : null;
  });

  /** All reported periods of this deliverable, oldest first, for previous/next navigation. */
  private reportedPeriods = computed(() => {
    const p = this.priority();
    if (!p) return [];
    const periods: { year: number; quarter: string }[] = [];
    for (const year of Object.keys(p.yearlyPerformance || {}).map(Number).sort((a, b) => a - b)) {
      for (const q of KPI.getQuarters(p, year)) periods.push({ year, quarter: q.key.toUpperCase() });
    }
    return periods;
  });

  private currentIndex = computed(() =>
    this.reportedPeriods().findIndex(r => r.year === this.year() && r.quarter === this.quarter())
  );

  previousPeriod = computed(() => {
    const i = this.currentIndex();
    return i > 0 ? this.reportedPeriods()[i - 1] : null;
  });

  nextPeriod = computed(() => {
    const i = this.currentIndex();
    const periods = this.reportedPeriods();
    return i >= 0 && i < periods.length - 1 ? periods[i + 1] : null;
  });

  ngOnInit(): void {
    // The same component instance is reused when moving between quarters, so follow the params
    this.sub = this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '';
      this.year.set(Number(params.get('year')));
      this.quarter.set((params.get('quarter') || 'Q1').toUpperCase());
      if (this.priority()?.id !== id) this.load(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getOne(id).subscribe({
      next: (p) => {
        this.priority.set(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load this report.');
        this.loading.set(false);
      }
    });
  }

  hasPeriod(quarter: string): boolean {
    return !!this.priority()?.yearlyPerformance?.[this.year().toString()]?.[quarter.toLowerCase()];
  }

  goToPeriod(year: number, quarter: string): void {
    const p = this.priority();
    if (!p) return;
    this.router.navigate([p.id, 'reports', year, quarter], { relativeTo: this.route.parent });
  }

  /** Back to the list, on this report's year with its deliverable expanded. */
  backToList(): void {
    this.router.navigate(['./'], {
      relativeTo: this.route.parent,
      queryParams: { year: this.year(), expand: this.priority()?.id }
    });
  }

  /** Opens the list's report form on this period. */
  editReport(): void {
    this.router.navigate(['./'], {
      relativeTo: this.route.parent,
      queryParams: { year: this.year(), expand: this.priority()?.id, editReport: this.quarter() }
    });
  }
}
