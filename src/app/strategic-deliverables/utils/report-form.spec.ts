import { emptyReport, hasReport, nextOpenQuarter, reportFormFor, reportPayload, reportYearOptions, suggestedQuarterTarget } from './report-form';
import { StrategicDeliverable } from '../services/strategic-deliverables.service';

const kpi = {
  id: 'k', serialNumber: 1, category: 'AGENCY', ministry: '', priorityArea: 'A', outcome: 'O', deliverable: '', indicator: 'I',
  baselineType: '', baselineYear: 2025, responsibleDepartment: 'D', supportingEvidence: '', createdAt: '', updatedAt: '',
  annualAggregation: 'sum', annualTargets: [{ baselineYear: 2025, baselineValue: 0, targetYear: 2026, targetValue: 100 }],
  yearlyPerformance: { '2026': { q1: { target: 25, actual: 20 }, q2: { target: 25, actual: 30 } } },
} as StrategicDeliverable;

describe('quarterly report form rules', () => {
  it('offers report years from the KPI\'s report year to next year, plus a requested year', () => {
    const years = reportYearOptions(kpi, 2030, 2024);
    expect(years[0]).toBe(2024);
    expect(years).toContain(2026);
    expect(years[years.length - 1]).toBe(new Date().getFullYear() + 1);
  });

  it('knows which quarters are reported and which is next', () => {
    expect(hasReport(kpi, 2026, 'Q2')).toBe(true);
    expect(hasReport(kpi, 2026, 'Q3')).toBe(false);
    expect(nextOpenQuarter(kpi, 2026)).toBe('Q3');
    expect(nextOpenQuarter(kpi, 2027)).toBe('Q1');
  });

  it('suggests a quarter\'s share of a summed annual target', () => {
    expect(suggestedQuarterTarget(kpi, 2026)).toBe(25);
    expect(suggestedQuarterTarget({ ...kpi, annualAggregation: 'latest' }, 2026)).toBe(100);
    expect(suggestedQuarterTarget(kpi, 2030)).toBeNull();
  });

  it('fills the form from a saved report, else from recorded figures, else a suggestion', () => {
    const saved = { id: 'r', year: 2026, quarter: 'Q1', targetValue: 25, actualValue: 20, progress: 'Done', keyIssues: '' };
    expect(reportFormFor(kpi, 2026, 'Q1', saved)).toMatchObject({ targetValue: 25, actualValue: 20, progress: 'Done', comments: '' });
    expect(reportFormFor(kpi, 2026, 'Q2')).toMatchObject({ targetValue: 25, actualValue: 30 });
    expect(reportFormFor(kpi, 2026, 'Q3')).toMatchObject({ targetValue: 25, actualValue: null });
  });

  it('turns the form into a request body, or an error when figures are missing', () => {
    expect(reportPayload(emptyReport(2026, 'Q3'))).toContain('Target and Actual');
    expect(reportPayload({ ...emptyReport(2026, 'Q3'), targetValue: 25, actualValue: 24 }))
      .toMatchObject({ year: 2026, quarter: 'Q3', targetValue: 25, actualValue: 24 });
  });
});
