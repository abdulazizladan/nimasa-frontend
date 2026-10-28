import { PdfReportService } from './pdf-report.service';
import { PRESIDENTIAL_CONFIG } from '../deliverables-config';
import { summariseFamilies, uniqueItems } from '../utils/portfolio-summary';
import { StrategicDeliverable } from './strategic-deliverables.service';

const YEAR = 2026;
const kpi = {
  id: 'k1', serialNumber: 3, category: 'PRESIDENTIAL_PRIORITY', ministry: 'NIMASA', priorityArea: 'Maritime safety',
  outcome: 'Safer ports', deliverable: '', indicator: 'Vessel turnaround (days)', baselineType: '', baselineYear: YEAR - 1,
  responsibleDepartment: 'NIMASA', supportingEvidence: '', performanceDirection: 'lower', annualAggregation: 'average',
  annualTargets: [{ baselineYear: YEAR - 1, baselineValue: 7, targetYear: YEAR, targetValue: 4 }],
  yearlyPerformance: { [YEAR]: { q1: { target: 4, actual: 6 }, q2: { target: 4, actual: 3 } } },
  monthlySubmissions: [
    { id: 'r1', year: YEAR, quarter: 'Q2', progress: 'New berthing windows', keyIssues: 'Dredging', mdaEfforts: 'Night shifts', comments: 'Needs funding' },
  ],
  createdAt: '', updatedAt: '',
} as unknown as StrategicDeliverable;

/** All text in a pdfmake document, flattened */
const textOf = (node: any): string => {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'object') return Object.entries(node).filter(([k]) => k !== 'svg' && k !== 'styles').map(([, v]) => textOf(v)).join(' ');
  return '';
};

describe('PdfReportService documents', () => {
  const service = new PdfReportService();

  it('builds a period summary with the figures, status by type and every KPI', () => {
    const families = summariseFamilies([{ source: PRESIDENTIAL_CONFIG, deliverables: [kpi], failed: false }], YEAR, 1);
    const doc = service.summaryDocument({
      period: { year: YEAR, quarter: 1 }, scope: 'All types · All departments', families, items: uniqueItems(families),
      nationalAreas: [], agencyAreas: [], latest: { year: YEAR, quarter: 1 },
    });
    const text = textOf(doc.content);
    expect(doc.pageSize).toBe('A4');
    expect(text).toContain('Performance Report · Q2 2026');
    expect(text).toContain('Latest results: Q2 2026');
    expect(text).toContain('Status by type');
    expect(text).toContain('#3 Safer ports');
    expect(text).toContain('Target Surpassed');   // 3 days against a target of 4, lower is better
  });

  it('builds a KPI report with the chart, quarters and notes, leaving out support required for guests', () => {
    const doc = service.kpiDocument({ deliverable: kpi, source: PRESIDENTIAL_CONFIG, period: { year: YEAR, quarter: null }, includeSupportRequired: false });
    const text = textOf(doc.content);
    expect(doc.content.some((n: any) => typeof n.svg === 'string' && n.svg.startsWith('<svg'))).toBe(true);
    expect(text).toContain('Q1 2026');
    expect(text).toContain('Lower is better');
    expect(text).toContain('New berthing windows');
    expect(text).not.toContain('Needs funding');

    const adminDoc = service.kpiDocument({ deliverable: kpi, source: PRESIDENTIAL_CONFIG, period: { year: YEAR, quarter: null }, includeSupportRequired: true });
    expect(textOf(adminDoc.content)).toContain('Needs funding');
  });
});
