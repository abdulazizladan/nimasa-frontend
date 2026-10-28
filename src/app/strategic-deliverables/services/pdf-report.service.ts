import { Injectable } from '@angular/core';
import { StrategicDeliverable, QuarterlyReport } from './strategic-deliverables.service';
import { DeliverablesConfig, CATEGORY_LABELS } from '../deliverables-config';
import {
  AssessedDeliverable, FamilySummary, Period, StatusRow, StatusClass, STATUS_CLASSES,
  periodLabel, ownerOf, assessForPeriod
} from '../utils/portfolio-summary';
import { getAggregationLabel, getBaselineForYear, getAnnualTarget, isLowerBetter, QUARTER_KEYS } from '../utils/kpi-performance';
import { kpiTimeline, timelineSvg } from '../utils/kpi-timeline';

/** Inputs for the period summary report (the dashboard as a document). */
export interface SummaryReportInput {
  period: Period;
  /** e.g. "All types · All departments" */
  scope: string;
  families: FamilySummary[];
  items: AssessedDeliverable[];
  nationalAreas: StatusRow[];
  agencyAreas: StatusRow[];
  /** Most recent quarter with results, for "Latest results: Q3 2026" */
  latest: Period | null;
}

/** Inputs for a single KPI report. */
export interface KpiReportInput {
  deliverable: StrategicDeliverable;
  source: DeliverablesConfig;
  period: Period;
  /** Whether to include "support required" from the report notes (admins only) */
  includeSupportRequired: boolean;
}

const BRAND = '#008751';
const INK = '#17211c';
const MUTED = '#5b6661';
const LINE = '#dde4e0';
const STATUS_FILL: Record<StatusClass, string> = { good: '#0ca30c', warning: '#fab219', critical: '#d03b3b', none: '#a3a29b' };
/** Light cell backgrounds for status labels in tables (the label text carries the meaning) */
const STATUS_WASH: Record<StatusClass, string> = { good: '#dcfce7', warning: '#fef9c3', critical: '#fee2e2', none: '#f1f5f9' };

const fmt = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: 2 });
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Builds PDF reports in the browser with pdfmake. The library (about 2 MB with fonts) is loaded
 * only the first time someone downloads a report, so pages don't get slower.
 */
@Injectable({ providedIn: 'root' })
export class PdfReportService {
  private pdfMake: any = null;

  private async lib(): Promise<any> {
    if (!this.pdfMake) {
      const pdfMakeModule: any = await import('pdfmake/build/pdfmake');
      const fontsModule: any = await import('pdfmake/build/vfs_fonts');
      const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
      pdfMake.addVirtualFileSystem(fontsModule.default ?? fontsModule);
      this.pdfMake = pdfMake;
    }
    return this.pdfMake;
  }

  /** Downloads the period summary report. */
  async downloadSummary(input: SummaryReportInput): Promise<void> {
    const pdfMake = await this.lib();
    const label = periodLabel(input.period);
    await pdfMake.createPdf(this.summaryDocument(input)).download(`nimasa-performance-report-${label.replace(' ', '-')}.pdf`);
  }

  /** Downloads one KPI's report. */
  async downloadKpi(input: KpiReportInput): Promise<void> {
    const pdfMake = await this.lib();
    const d = input.deliverable;
    const name = `nimasa-kpi-${d.serialNumber}-${periodLabel(input.period).replace(' ', '-')}.pdf`;
    await pdfMake.createPdf(this.kpiDocument(input)).download(name);
  }

  // ── Documents (exposed for tests) ──

  summaryDocument(input: SummaryReportInput): any {
    const label = periodLabel(input.period);
    const counts = { good: 0, warning: 0, critical: 0, none: 0 } as Record<StatusClass, number>;
    input.items.forEach(i => counts[i.status]++);
    const withData = input.items.length - counts.none;
    const share = withData ? `${Math.round((counts.good / withData) * 100)}%` : '—';

    const content: any[] = [
      this.titleBlock(`Performance Report · ${label}`,
        `${input.scope} · Generated ${today()}${input.latest ? ` · Latest results: ${periodLabel(input.latest)}` : ''}`),
      {
        columns: [
          this.figure(share, 'surpassed, met or on track'),
          this.figure(String(withData), `KPIs with results for ${label}`),
          this.figure(String(counts.critical), 'off track or missed'),
        ],
        columnGap: 10,
        margin: [0, 0, 0, 14],
      },
      this.statusLegend(),
      { text: 'Status by type', style: 'h2' },
      ...input.families.map(f => this.barRow(f.source.title, f.counts, f.total)),
    ];

    if (input.nationalAreas.length || input.agencyAreas.length) {
      content.push({ text: 'How the priorities are doing', style: 'h2' });
      if (input.nationalAreas.length) {
        content.push({ text: 'NATIONAL', style: 'group' }, ...input.nationalAreas.map(r => this.barRow(r.label, r.counts, r.total)));
      }
      if (input.agencyAreas.length) {
        content.push({ text: 'AGENCY', style: 'group' }, ...input.agencyAreas.map(r => this.barRow(r.label, r.counts, r.total)));
      }
    }

    content.push({ text: 'KPIs', style: 'h2', pageBreak: input.items.length > 6 ? 'before' : undefined });
    if (input.items.length) {
      content.push({
        table: {
          headerRows: 1,
          widths: [58, '*', 80, 42, 42, 74],
          body: [
            ['Type', 'KPI', 'Owner', 'Target', 'Actual', 'Status'].map(h => ({ text: h, style: ['Target', 'Actual'].includes(h) ? 'thNum' : 'th' })),
            ...[...input.items]
              .sort((a, b) => a.source.title.localeCompare(b.source.title) || a.deliverable.serialNumber - b.deliverable.serialNumber)
              .map(i => [
                { text: CATEGORY_LABELS[i.deliverable.category] ?? i.source.badge, style: 'td' },
                { stack: [
                  { text: `#${i.deliverable.serialNumber} ${i.deliverable.outcome || i.deliverable.deliverable || ''}`.trim(), style: 'tdStrong' },
                  { text: i.deliverable.indicator, style: 'tdMuted' },
                ] },
                { text: ownerOf(i.deliverable), style: 'td' },
                { text: fmt(i.summary?.target), style: 'tdNum' },
                { text: fmt(i.summary?.actual), style: 'tdNum' },
                { text: i.status === 'none' ? 'No result' : i.assessment.label, style: 'td', fillColor: STATUS_WASH[i.status] },
              ]),
          ],
        },
        layout: this.tableLayout(),
      });
    } else {
      content.push({ text: 'No KPIs match this report.', style: 'muted' });
    }

    return this.document(content, `Performance Report ${label}`);
  }

  kpiDocument(input: KpiReportInput): any {
    const { deliverable: d, source, period } = input;
    const label = periodLabel(period);
    const result = assessForPeriod(d, source, period);
    const baseline = getBaselineForYear(d, period.year);
    const chart = timelineSvg(d, 500, 210);

    const content: any[] = [
      this.titleBlock(d.outcome || d.deliverable || d.indicator,
        `${d.indicator} · ${CATEGORY_LABELS[d.category] ?? source.badge} · ${d.priorityArea || 'No priority area'} · ${ownerOf(d)} · Generated ${today()}`),
      {
        columns: [
          this.figure(fmt(baseline?.value ?? null), `Baseline${baseline ? ` (${baseline.label})` : ''}`),
          this.figure(fmt(getAnnualTarget(d, period.year)), `Target ${period.year}`),
          this.figure(fmt(result.summary?.actual), `Result ${label}`),
          this.figure(result.status === 'none' ? 'No result' : result.assessment.label, `Status ${label}`, true),
        ],
        columnGap: 10,
        margin: [0, 0, 0, 6],
      },
      { text: `${isLowerBetter(d) ? 'Lower is better' : 'Higher is better'} · Annual figure: ${getAggregationLabel(d)}${result.assessment.deviation ? ` · ${result.assessment.deviation}` : ''}`, style: 'muted', margin: [0, 0, 0, 12] },
      { text: 'Quarterly results against target', style: 'h2' },
    ];

    if (chart) {
      // Line keys drawn as shapes (the bundled font has no line-drawing characters)
      const key = (color: string, width: number) => ({ canvas: [{ type: 'line', x1: 0, y1: 5, x2: 14, y2: 5, lineWidth: width, lineColor: color }], width: 18 });
      content.push({
        columns: [key('#2a78d6', 2), { text: 'Actual', style: 'muted', width: 40 }, key('#64748b', 1.5), { text: 'Target', style: 'muted', width: 'auto' }],
        columnGap: 2,
        margin: [0, 0, 0, 4],
      });
      content.push({ svg: chart, width: 500, margin: [0, 0, 0, 10] });
      content.push({
        table: {
          headerRows: 1,
          widths: [80, 70, 70, '*'],
          body: [
            ['Quarter', 'Target', 'Actual', 'Status'].map(h => ({ text: h, style: ['Target', 'Actual'].includes(h) ? 'thNum' : 'th' })),
            ...kpiTimeline(d).map(p => {
              const quarterResult = assessForPeriod(d, source, { year: p.year, quarter: p.quarter });
              return [
                { text: p.label, style: 'td' },
                { text: fmt(p.target), style: 'tdNum' },
                { text: p.actual === null ? 'No report' : fmt(p.actual), style: 'tdNum' },
                { text: p.actual === null ? '—' : quarterResult.assessment.label, style: 'td', fillColor: p.actual === null ? undefined : STATUS_WASH[quarterResult.status] },
              ];
            }),
          ],
        },
        layout: this.tableLayout(),
        margin: [0, 0, 0, 12],
      });
    } else {
      content.push({ text: 'No quarterly results reported yet.', style: 'muted', margin: [0, 0, 0, 12] });
    }

    const notes = this.notesFor(d.monthlySubmissions ?? [], period, input.includeSupportRequired);
    if (notes.length) {
      content.push({ text: `Report notes · ${period.year}`, style: 'h2' }, ...notes);
    }

    return this.document(content, `${d.indicator} ${label}`);
  }

  // ── Building blocks ──

  private notesFor(reports: QuarterlyReport[], period: Period, includeSupport: boolean): any[] {
    const fields: [keyof QuarterlyReport, string][] = [
      ['progress', 'Progress'], ['keyIssues', 'Key issues'], ['mdaEfforts', 'Mitigation'],
      ...(includeSupport ? [['comments', 'Support required'] as [keyof QuarterlyReport, string]] : []),
    ];
    return reports
      .filter(r => Number(r.year) === period.year && (period.quarter === null || r.quarter === `Q${period.quarter + 1}`))
      .sort((a, b) => QUARTER_KEYS.indexOf((a.quarter || '').toLowerCase()) - QUARTER_KEYS.indexOf((b.quarter || '').toLowerCase()))
      .map(r => {
        const lines = fields.filter(([key]) => r[key]).map(([key, label]) => ({ text: [{ text: `${label}: `, bold: true }, String(r[key])], style: 'note' }));
        return lines.length ? { stack: [{ text: `${r.quarter} ${r.year}`, style: 'noteHead' }, ...lines], margin: [0, 0, 0, 8] } : null;
      })
      .filter(Boolean);
  }

  private titleBlock(title: string, subtitle: string): any {
    return {
      stack: [
        { text: 'NIMASA PERFORMANCE MONITORING SYSTEM', style: 'eyebrow' },
        { text: title, style: 'h1' },
        { text: subtitle, style: 'muted' },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 2, lineColor: BRAND }] },
      ],
      margin: [0, 0, 0, 14],
    };
  }

  private figure(value: string, caption: string, small = false): any {
    return {
      stack: [{ text: value, style: small ? 'figureSmall' : 'figure' }, { text: caption, style: 'muted' }],
      margin: [0, 0, 0, 4],
    };
  }

  private statusLegend(): any {
    return {
      columns: STATUS_CLASSES.map(s => ({
        columns: [
          { canvas: [{ type: 'rect', x: 0, y: 2, w: 8, h: 8, color: STATUS_FILL[s.key] }], width: 12 },
          { text: s.label, style: 'muted' },
        ],
      })),
      margin: [0, 0, 0, 6],
    };
  }

  /** A 100% stacked status bar with the group name and total, drawn as vector shapes. */
  private barRow(label: string, counts: Record<StatusClass, number>, total: number): any {
    const width = 280;
    const shapes: any[] = [];
    let x = 0;
    if (total) {
      for (const s of STATUS_CLASSES) {
        const c = counts[s.key];
        if (!c) continue;
        const w = (c / total) * width;
        shapes.push({ type: 'rect', x, y: 0, w: Math.max(w - 1, 1), h: 10, color: STATUS_FILL[s.key] });
        x += w;
      }
    } else {
      shapes.push({ type: 'rect', x: 0, y: 0, w: width, h: 10, color: '#f1f5f9' });
    }
    // The counts in words under each bar, so the report reads correctly in black-and-white print
    const breakdown = STATUS_CLASSES.filter(s => counts[s.key]).map(s => `${counts[s.key]} ${s.label.toLowerCase()}`).join(', ');
    return {
      stack: [
        { columns: [{ text: label, style: 'td', width: 150 }, { canvas: shapes, width }, { text: String(total), style: 'tdNum', width: 30 }], columnGap: 8 },
        { text: breakdown || 'No deliverables', style: 'tdMuted', margin: [158, 1, 0, 0] },
      ],
      margin: [0, 3, 0, 3],
    };
  }

  private tableLayout(): any {
    return {
      hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
      vLineWidth: () => 0,
      hLineColor: () => LINE,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 4,
      paddingRight: () => 4,
    };
  }

  private document(content: any[], title: string): any {
    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      info: { title, author: 'NIMASA Performance Monitoring System' },
      content,
      footer: (page: number, pages: number) => ({
        columns: [
          { text: 'NIMASA Performance Monitoring System', style: 'footer' },
          { text: `Page ${page} of ${pages}`, style: 'footer', alignment: 'right' },
        ],
        margin: [40, 16, 40, 0],
      }),
      defaultStyle: { fontSize: 9, color: INK, lineHeight: 1.2 },
      styles: {
        eyebrow: { fontSize: 7, bold: true, color: BRAND, characterSpacing: 1, margin: [0, 0, 0, 3] },
        h1: { fontSize: 18, bold: true, margin: [0, 0, 0, 3] },
        h2: { fontSize: 12, bold: true, margin: [0, 10, 0, 6] },
        group: { fontSize: 7, bold: true, color: MUTED, characterSpacing: 0.8, margin: [0, 4, 0, 2] },
        figure: { fontSize: 20, bold: true },
        figureSmall: { fontSize: 11, bold: true, margin: [0, 5, 0, 4] },
        muted: { fontSize: 8, color: MUTED },
        th: { fontSize: 7, bold: true, color: MUTED },
        thNum: { fontSize: 7, bold: true, color: MUTED, alignment: 'right' },
        td: { fontSize: 8 },
        tdStrong: { fontSize: 8, bold: true },
        tdMuted: { fontSize: 7, color: MUTED },
        tdNum: { fontSize: 8, alignment: 'right' },
        noteHead: { fontSize: 9, bold: true, margin: [0, 0, 0, 2] },
        note: { fontSize: 8, margin: [0, 0, 0, 2] },
        footer: { fontSize: 7, color: MUTED },
      },
    };
  }
}
