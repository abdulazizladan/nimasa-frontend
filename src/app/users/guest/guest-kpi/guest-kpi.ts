import { Component, OnDestroy, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { AllDeliverablesService } from '../../../strategic-deliverables/services/all-deliverables.service';
import { PdfReportService } from '../../../strategic-deliverables/services/pdf-report.service';
import { StrategicDeliverable, QuarterlyReport } from '../../../strategic-deliverables/services/strategic-deliverables.service';
import { DeliverablesConfig, CATEGORY_LABELS } from '../../../strategic-deliverables/deliverables-config';
import { assessForPeriod, ownerOf, periodLabel } from '../../../strategic-deliverables/utils/portfolio-summary';
import {
  getAnnualTarget, getBaselineForYear, getAggregationLabel, isLowerBetter, QUARTER_KEYS
} from '../../../strategic-deliverables/utils/kpi-performance';

/** Notes guests may read from each quarterly report ("support required" stays internal) */
const GUEST_NOTE_FIELDS: { key: keyof QuarterlyReport; label: string }[] = [
  { key: 'progress', label: 'Progress' },
  { key: 'keyIssues', label: 'Key issues' },
  { key: 'mdaEfforts', label: 'Mitigation' },
];

/** One KPI, read-only: targets, results over the quarters, the year's reports and notes, and a PDF. */
@Component({
  selector: 'app-guest-kpi',
  standalone: false,
  templateUrl: './guest-kpi.html',
  styleUrls: ['../guest-pages.css', './guest-kpi.css'],
})
export class GuestKpi implements OnInit, OnDestroy {
  private service = inject(AllDeliverablesService);
  private pdf = inject(PdfReportService);
  private globalState = inject(GlobalStateService);
  private route = inject(ActivatedRoute);
  private subs: Subscription[] = [];

  readonly noteFields = GUEST_NOTE_FIELDS;
  private id = signal('');
  year = signal(this.globalState.getYear());
  quarter = signal<number | null>(this.globalState.getQuarter());
  period = computed(() => ({ year: this.year(), quarter: this.quarter() }));
  periodName = computed(() => periodLabel(this.period()));

  /** The page the KPI belongs to, found in the shared lists */
  source = computed<DeliverablesConfig | null>(() =>
    this.service.results().find(r => r.deliverables.some(d => d.id === this.id()))?.source ?? null
  );
  /** The KPI with its quarterly reports and notes */
  deliverable = signal<StrategicDeliverable | null>(null);
  error = signal<string | null>(null);
  notFound = computed(() => this.service.loaded() && !this.source());
  downloading = signal(false);

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
    const reports = this.deliverable()?.monthlySubmissions ?? [];
    return reports
      .filter(r => Number(r.year) === this.year() && (this.quarter() === null || r.quarter === `Q${(this.quarter() ?? 0) + 1}`))
      .filter(r => GUEST_NOTE_FIELDS.some(f => r[f.key]))
      .sort((a, b) => QUARTER_KEYS.indexOf((a.quarter || '').toLowerCase()) - QUARTER_KEYS.indexOf((b.quarter || '').toLowerCase()));
  });

  constructor() {
    // Once the KPI's page is known, fetch the KPI with its reports
    effect(() => {
      const source = this.source();
      const id = this.id();
      if (!source || !id) return;
      untracked(() => {
        this.error.set(null);
        this.service.loadOne(source, id).subscribe({
          next: d => this.deliverable.set(d),
          error: () => this.error.set("This KPI couldn't be loaded. Check your connection and try again."),
        });
      });
    });
  }

  ngOnInit(): void {
    this.subs.push(this.route.paramMap.subscribe(p => { this.deliverable.set(null); this.id.set(p.get('id') ?? ''); }));
    this.subs.push(this.globalState.selectedYear$.subscribe(y => this.year.set(y)));
    this.subs.push(this.globalState.selectedQuarter$.subscribe(q => this.quarter.set(q)));
    this.service.ensureLoaded();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
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
    this.error.set(null);
    try {
      await this.pdf.downloadKpi({ deliverable: d, source: s, period: this.period(), includeSupportRequired: false });
    } catch {
      this.error.set("The PDF couldn't be created. Check your connection and try again.");
    } finally {
      this.downloading.set(false);
    }
  }
}
