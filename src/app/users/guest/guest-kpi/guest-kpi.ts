import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { AllDeliverablesService } from '../../../strategic-deliverables/services/all-deliverables.service';
import { PdfReportService } from '../../../strategic-deliverables/services/pdf-report.service';
import { StrategicDeliverable, QuarterlyReport } from '../../../strategic-deliverables/services/strategic-deliverables.service';
import { DeliverablesConfig, CATEGORY_LABELS } from '../../../strategic-deliverables/deliverables-config';
import { assessForPeriod, ownerOf, periodLabel } from '../../../strategic-deliverables/utils/portfolio-summary';
import {
  getAnnualTarget, getBaselineForYear, getAggregationLabel, isLowerBetter, deliverableTitle, quarterIndex, QUARTER_KEYS
} from '../../../strategic-deliverables/utils/kpi-performance';
import { ROUTES } from '../../../core/routes';

/** Notes guests may read from each quarterly report ("support required" stays internal) */
const GUEST_NOTE_FIELDS: { key: keyof QuarterlyReport; label: string }[] = [
  { key: 'progress', label: 'Progress' },
  { key: 'keyIssues', label: 'Key issues' },
  { key: 'mdaEfforts', label: 'Mitigation' },
];

const LOAD_ERROR = "This KPI couldn't be loaded. Check your connection and try again.";

/** One KPI, read-only: targets, results over the quarters, the year's reports and notes, and a PDF. */
@Component({
  selector: 'app-guest-kpi',
  standalone: false,
  templateUrl: './guest-kpi.html',
  styleUrls: ['../guest-pages.css', './guest-kpi.css'],
})
export class GuestKpi implements OnInit {
  private service = inject(AllDeliverablesService);
  private pdf = inject(PdfReportService);
  private globalState = inject(GlobalStateService);
  private route = inject(ActivatedRoute);

  readonly noteFields = GUEST_NOTE_FIELDS;
  readonly kpisPath = ROUTES.guest.kpis;
  private id = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')), { initialValue: '' });
  year = this.globalState.selectedYear;
  quarter = this.globalState.selectedQuarter;
  period = computed(() => ({ year: this.year(), quarter: this.quarter() }));
  periodName = computed(() => periodLabel(this.period()));

  /** The page the KPI belongs to, found in the shared lists */
  source = computed<DeliverablesConfig | null>(() =>
    this.service.results().find(r => r.deliverables.some(d => d.id === this.id()))?.source ?? null
  );
  notFound = computed(() => this.service.loaded() && !this.source());

  /** The KPI with its quarterly reports, fetched whenever the id or its page changes; a late response for an earlier KPI is dropped */
  private fetched = toSignal(
    toObservable(computed(() => ({ source: this.source(), id: this.id() }))).pipe(
      switchMap(({ source, id }) => {
        if (!source || !id) return of({ deliverable: null, error: null });
        return this.service.loadOne(source, id).pipe(
          map(deliverable => ({ deliverable, error: null as string | null })),
          catchError(() => of({ deliverable: null, error: LOAD_ERROR }))
        );
      })
    ),
    { initialValue: { deliverable: null as StrategicDeliverable | null, error: null as string | null } }
  );
  deliverable = computed(() => this.fetched().deliverable);
  loadError = computed(() => this.fetched().error);
  pdfError = signal<string | null>(null);
  error = computed(() => this.loadError() ?? this.pdfError());
  downloading = signal(false);

  title = computed(() => {
    const d = this.deliverable();
    return d ? deliverableTitle(d) : '';
  });
  result = computed(() => {
    const d = this.deliverable(), s = this.source();
    return d && s ? assessForPeriod(d, s, this.period()) : null;
  });
  baseline = computed(() => {
    const d = this.deliverable();
    return d ? getBaselineForYear(d, this.year()) : null;
  });
  annualTarget = computed(() => {
    const d = this.deliverable();
    return d ? getAnnualTarget(d, this.year()) : null;
  });

  /** The selected year's quarters, each with its result and status */
  quarterRows = computed(() => {
    const d = this.deliverable(), s = this.source();
    if (!d || !s) return [];
    return QUARTER_KEYS.map((key, q) => {
      const entry = d.yearlyPerformance?.[String(this.year())]?.[key];
      const r = assessForPeriod(d, s, { year: this.year(), quarter: q });
      return { quarter: `Q${q + 1}`, entry, result: r, selected: this.quarter() === q };
    });
  });

  /** The year's reports with notes, in quarter order (one quarter when a quarter is selected) */
  notes = computed(() => {
    const reports = this.deliverable()?.quarterlyReports ?? [];
    return reports
      .filter(r => Number(r.year) === this.year() && (this.quarter() === null || r.quarter === `Q${(this.quarter() ?? 0) + 1}`))
      .filter(r => GUEST_NOTE_FIELDS.some(f => r[f.key]))
      .sort((a, b) => quarterIndex(a.quarter) - quarterIndex(b.quarter));
  });

  ngOnInit(): void {
    this.service.ensureLoaded();
  }

  typeLabel(d: StrategicDeliverable): string {
    return CATEGORY_LABELS[d.category] ?? d.category;
  }

  ownerOf(d: StrategicDeliverable): string {
    return ownerOf(d);
  }

  direction(d: StrategicDeliverable): string {
    return isLowerBetter(d) ? 'Lower is better' : 'Higher is better';
  }

  aggregation(d: StrategicDeliverable): string {
    return getAggregationLabel(d);
  }

  async downloadPdf(): Promise<void> {
    const d = this.deliverable(), s = this.source();
    if (!d || !s) return;
    this.downloading.set(true);
    this.pdfError.set(null);
    try {
      await this.pdf.downloadKpi({ deliverable: d, source: s, period: this.period(), includeSupportRequired: false });
    } catch {
      this.pdfError.set("The PDF couldn't be created. Check your connection and try again.");
    } finally {
      this.downloading.set(false);
    }
  }
}
