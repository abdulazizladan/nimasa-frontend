import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { AllDeliverablesService, DELIVERABLE_SOURCES } from '../../../strategic-deliverables/services/all-deliverables.service';
import { PdfReportService } from '../../../strategic-deliverables/services/pdf-report.service';
import {
  applyFilters, summariseFamilies, uniqueItems, ownerOf, statusByGroup, periodLabel, latestReportedQuarter
} from '../../../strategic-deliverables/utils/portfolio-summary';

type ReportKind = 'summary' | 'kpi';

/** Builds a PDF: a period summary (optionally for one type or department) or a single KPI's report. */
@Component({
  selector: 'app-guest-reports',
  standalone: false,
  templateUrl: './guest-reports.html',
  styleUrls: ['../guest-pages.css', './guest-reports.css'],
})
export class GuestReports implements OnInit, OnDestroy {
  private service = inject(AllDeliverablesService);
  private pdf = inject(PdfReportService);
  private globalState = inject(GlobalStateService);
  private subs: Subscription[] = [];

  readonly typeOptions = DELIVERABLE_SOURCES.map(s => ({ id: s.id, title: s.title }));

  kind = signal<ReportKind>('summary');
  type = signal('');
  owner = signal('');
  kpiId = signal('');

  year = signal(this.globalState.getYear());
  quarter = signal<number | null>(this.globalState.getQuarter());
  period = computed(() => ({ year: this.year(), quarter: this.quarter() }));
  periodName = computed(() => periodLabel(this.period()));
  loading = computed(() => !this.service.loaded());
  downloading = signal(false);
  message = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);

  private families = computed(() =>
    summariseFamilies(applyFilters(this.service.results(), { type: this.type(), owner: this.owner() }), this.year(), this.quarter())
  );
  private items = computed(() => uniqueItems(this.families()));

  /** Every KPI active in the year, for the single-KPI report */
  kpiOptions = computed(() =>
    uniqueItems(summariseFamilies(this.service.results(), this.year(), this.quarter()))
      .map(i => ({ id: i.deliverable.id, label: `${i.source.badge} #${i.deliverable.serialNumber} · ${i.deliverable.indicator}`, item: i }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );
  ownerOptions = computed(() =>
    [...new Set(uniqueItems(summariseFamilies(this.service.results(), this.year(), null)).map(i => ownerOf(i.deliverable)))].sort()
  );

  /** What the chosen report will contain, shown before downloading */
  preview = computed(() => {
    if (this.kind() === 'kpi') {
      const option = this.kpiOptions().find(o => o.id === this.kpiId());
      return option ? `${option.item.deliverable.indicator}: targets, results over the quarters and ${this.periodName()} report notes.` : 'Choose a KPI.';
    }
    const n = this.items().length;
    return `${n} KPI${n === 1 ? '' : 's'}: headline figures, status by type, how the priorities are doing, and a table of every KPI for ${this.periodName()}.`;
  });

  canDownload = computed(() => !this.loading() && !this.downloading() && (this.kind() === 'summary' || !!this.kpiId()));

  ngOnInit(): void {
    this.subs.push(this.globalState.selectedYear$.subscribe(y => this.year.set(y)));
    this.subs.push(this.globalState.selectedQuarter$.subscribe(q => this.quarter.set(q)));
    this.service.ensureLoaded();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  async download(): Promise<void> {
    this.downloading.set(true);
    this.message.set(null);
    try {
      if (this.kind() === 'summary') {
        const items = this.items();
        const type = this.typeOptions.find(t => t.id === this.type())?.title ?? 'All types';
        await this.pdf.downloadSummary({
          period: this.period(),
          scope: `${type} · ${this.owner() || 'All departments'}`,
          families: this.families(),
          items,
          nationalAreas: statusByGroup(items.filter(i => i.source.id !== 'agency'), i => i.deliverable.priorityArea || 'No priority area'),
          agencyAreas: statusByGroup(items.filter(i => i.source.id === 'agency'), i => i.deliverable.priorityArea || 'No priority area'),
          latest: latestReportedQuarter(this.service.results()),
        });
      } else {
        const option = this.kpiOptions().find(o => o.id === this.kpiId());
        if (!option) return;
        // The KPI report needs the quarterly reports with their notes
        const deliverable = await firstValueFrom(this.service.loadOne(option.item.source, option.id));
        await this.pdf.downloadKpi({ deliverable, source: option.item.source, period: this.period(), includeSupportRequired: false });
      }
      this.message.set({ kind: 'ok', text: 'Your PDF has been downloaded.' });
    } catch {
      this.message.set({ kind: 'error', text: "The PDF couldn't be created. Check your connection and try again." });
    } finally {
      this.downloading.set(false);
    }
  }
}
