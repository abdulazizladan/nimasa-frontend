import { Component, OnInit, DestroyRef, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap, catchError, of } from 'rxjs';
import {
  StrategicDeliverable, StrategicDeliverablesService, QuarterlyReport
} from '../../services/strategic-deliverables.service';
import { AuthService } from '../../../auth/services/auth.service';
import * as KPI from '../../utils/kpi-performance';
import { DELIVERABLES_CONFIG } from '../../deliverables-config';
import { apiErrorMessage } from '../../../core/api';

/** Details page for one quarterly report of a deliverable: /:id/reports/:year/:quarter */
@Component({
  selector: 'app-quarterly-report-detail',
  standalone: false,
  templateUrl: './quarterly-report-detail.html',
  styleUrl: './quarterly-report-detail.css',
})
export class QuarterlyReportDetail implements OnInit {
  private service = inject(StrategicDeliverablesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  /** Labels for this page (presidential, ministerial or agency) */
  config = inject(DELIVERABLES_CONFIG);

  readonly canEdit = inject(AuthService).isAdmin();
  readonly quarterOptions = ['Q1', 'Q2', 'Q3', 'Q4'];

  deliverable = signal<StrategicDeliverable | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  year = signal(0);
  quarter = signal('Q1');

  getAggregationLabel = KPI.getAggregationLabel;
  getDirectionLabel = KPI.getDirectionLabel;
  getCategoryLabel = KPI.getCategoryLabel;
  title = computed(() => {
    const p = this.deliverable();
    return p ? KPI.deliverableTitle(p) : '';
  });

  /** The full saved report for this period, if one exists. */
  report = computed<QuarterlyReport | null>(() => {
    const p = this.deliverable();
    return p?.quarterlyReports?.find(r => Number(r.year) === this.year() && r.quarter === this.quarter()) ?? null;
  });

  /** Target/actual for this period: from the report, or from summary figures saved without a full report. */
  figures = computed<{ target: number | null; actual: number | null } | null>(() => {
    const report = this.report();
    if (report) return { target: report.targetValue ?? null, actual: report.actualValue ?? null };
    const summary = this.deliverable()?.yearlyPerformance?.[this.year().toString()]?.[this.quarterKey()];
    return summary ? { target: summary.target ?? null, actual: summary.actual ?? null } : null;
  });

  quarterAssessment = computed(() => {
    const p = this.deliverable();
    const f = this.figures();
    return p && f ? KPI.assess(p, f.actual, f.target, this.year(), true) : null;
  });

  yearSummary = computed(() => {
    const p = this.deliverable();
    return p ? KPI.getYearSummary(p, this.year()) : null;
  });

  yearAssessment = computed(() => {
    const p = this.deliverable();
    const s = this.yearSummary();
    return p && s ? KPI.assess(p, s.actual, s.target, this.year()) : null;
  });

  baseline = computed(() => {
    const p = this.deliverable();
    return p ? KPI.getBaselineForYear(p, this.year()) : null;
  });

  /** All reported periods of this deliverable, oldest first, for previous/next navigation. */
  private reportedPeriods = computed(() => {
    const p = this.deliverable();
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
    this.route.paramMap.pipe(
      tap(params => {
        this.year.set(Number(params.get('year')));
        this.quarter.set((params.get('quarter') || 'Q1').toUpperCase());
      }),
      switchMap(params => {
        const id = params.get('id') || '';
        if (this.deliverable()?.id === id) return of(null);
        this.loading.set(true);
        this.error.set(null);
        return this.service.getOne(id).pipe(
          tap(p => this.deliverable.set(p)),
          catchError(err => {
            this.error.set(apiErrorMessage(err, 'Failed to load this report.'));
            return of(null);
          }),
          tap(() => this.loading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private quarterKey() {
    return this.quarter().toLowerCase() as (typeof KPI.QUARTER_KEYS)[number];
  }

  /** Owner shown for the deliverable: a department, or "Organization-wide" where configured. */
  ownerLabel(department: string | undefined): string {
    const org = this.config.organizationWide;
    if (org && department === org.value) return 'Organization-wide';
    return department || '—';
  }

  hasPeriod(quarter: string): boolean {
    const key = quarter.toLowerCase() as (typeof KPI.QUARTER_KEYS)[number];
    return !!this.deliverable()?.yearlyPerformance?.[this.year().toString()]?.[key];
  }

  goToPeriod(year: number, quarter: string): void {
    const p = this.deliverable();
    if (!p) return;
    this.router.navigate([p.id, 'reports', year, quarter], { relativeTo: this.route.parent });
  }

  /** Back to the list, on this report's year with its deliverable expanded. */
  backToList(): void {
    this.router.navigate(['./'], {
      relativeTo: this.route.parent,
      queryParams: { year: this.year(), expand: this.deliverable()?.id }
    });
  }

  /** Opens the list's report form on this period. */
  editReport(): void {
    this.router.navigate(['./'], {
      relativeTo: this.route.parent,
      queryParams: { year: this.year(), expand: this.deliverable()?.id, editReport: this.quarter() }
    });
  }
}
