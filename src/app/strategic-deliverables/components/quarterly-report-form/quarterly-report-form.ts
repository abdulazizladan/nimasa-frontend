import { Component, OnInit, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Modal } from '../../../core/components/modal/modal';
import { Icon } from '../../../core/components/icon/icon';
import {
  StrategicDeliverable, StrategicDeliverablesService, QuarterlyReport, QuarterlyReportInput
} from '../../services/strategic-deliverables.service';
import { apiErrorMessage } from '../../../core/api';
import {
  QUARTERS, ReportForm, emptyReport, hasReport, nextOpenQuarter, periodKey, reportFormFor, reportPayload,
  reportYearOptions, savedReportFor
} from '../../utils/report-form';

export interface ReportSave {
  /** Set when the form is updating a saved report */
  reportId: string | null;
  report: QuarterlyReportInput;
}

/**
 * Quarterly report form, in a modal. It follows the selected year and quarter: it shows the saved
 * report for that period (and updates it on save) or a blank entry for a new one, keeping unsaved
 * typing per period while the user switches between them.
 */
@Component({
  selector: 'app-quarterly-report-form',
  standalone: true,
  imports: [FormsModule, Modal, Icon],
  templateUrl: './quarterly-report-form.html',
  styleUrl: './quarterly-report-form.css',
})
export class QuarterlyReportForm implements OnInit {
  private service = inject(StrategicDeliverablesService);
  private destroyRef = inject(DestroyRef);

  deliverable = input.required<StrategicDeliverable>();
  /** Period to open on; defaults to the viewed year (if it applies) and its first open quarter */
  year = input<number | null>(null);
  quarter = input<string | null>(null);
  viewedYear = input.required<number>();
  saving = input(false);
  serverError = input<string | null>(null);

  save = output<ReportSave>();
  remove = output<{ reportId: string; label: string }>();
  cancel = output<void>();

  readonly quarters = QUARTERS;
  yearOptions = signal<number[]>([]);
  form = signal<ReportForm>(emptyReport(new Date().getFullYear()));
  loading = signal(true);
  loadError = signal<string | null>(null);
  formError = signal('');
  private reports = signal<QuarterlyReport[]>([]);
  /** Unsaved entries per "year-quarter", kept while switching periods */
  private drafts = new Map<string, ReportForm>();

  /** The saved report for the selected period, if there is one (the form then updates it) */
  saved = computed(() => savedReportFor(this.reports(), this.form().year, this.form().quarter));
  periodLabel = computed(() => `${this.form().quarter} ${this.form().year}`);

  ngOnInit(): void {
    const d = this.deliverable();
    const options = reportYearOptions(d, this.viewedYear(), this.year() ?? undefined);
    const startYear = this.year() ?? (options.includes(this.viewedYear()) ? this.viewedYear() : options[0]);
    this.yearOptions.set(options);
    this.form.set(reportFormFor(d, startYear, this.quarter() ?? nextOpenQuarter(d, startYear)));

    this.service.getReports(d.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: reports => {
        this.reports.set(reports);
        this.loading.set(false);
        this.showPeriod(this.form().year, this.form().quarter);
      },
      error: err => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(err, 'Could not load saved reports; showing summary figures only.'));
      }
    });
  }

  hasReport(quarter: string): boolean {
    return hasReport(this.deliverable(), this.form().year, quarter);
  }

  patch<K extends keyof ReportForm>(field: K, value: ReportForm[K]): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  /** Year or quarter changed: keep what was typed, then show the newly selected period. */
  changePeriod(field: 'year' | 'quarter', value: string | number): void {
    const current = this.form();
    this.drafts.set(periodKey(current), current);
    const year = field === 'year' ? Number(value) : current.year;
    const quarter = field === 'quarter' ? String(value) : current.quarter;
    this.showPeriod(year, quarter);
  }

  /** Fills the form for a period: unsaved draft, else saved report, else a new entry. */
  private showPeriod(year: number, quarter: string): void {
    const draft = this.drafts.get(periodKey({ year, quarter }));
    if (draft) {
      this.form.set({ ...draft });
      return;
    }
    this.form.set(reportFormFor(this.deliverable(), year, quarter, savedReportFor(this.reports(), year, quarter)));
  }

  submit(): void {
    const payload = reportPayload(this.form());
    if (typeof payload === 'string') {
      this.formError.set(payload);
      return;
    }
    this.formError.set('');
    this.save.emit({ reportId: this.saved()?.id ?? null, report: payload });
  }

  deleteReport(): void {
    const saved = this.saved();
    if (saved) this.remove.emit({ reportId: saved.id, label: this.periodLabel() });
  }
}
