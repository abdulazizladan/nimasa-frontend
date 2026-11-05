import {
  AnnualTargetRow, buildDeliverablePayload, nextTargetYear, rowsToAnnualTargets, targetRowsFor, validateDeliverableForm,
  validateTargetRows
} from './deliverable-form';
import { StrategicDeliverable } from '../services/strategic-deliverables.service';

const row = (baselineYear: number | null, baselineValue: number | null, targetYear: number | null, targetValue: number | null): AnnualTargetRow =>
  ({ baselineYear, baselineValue, targetYear, targetValue });

describe('annual target rows', () => {
  it('ignores empty rows and sorts the rest by target year', () => {
    const targets = rowsToAnnualTargets([row(2026, 5, 2027, 9), row(null, null, null, null), row(2025, null, 2026, 7)]);
    expect(targets).toEqual([
      { baselineYear: 2025, baselineValue: null, targetYear: 2026, targetValue: 7 },
      { baselineYear: 2026, baselineValue: 5, targetYear: 2027, targetValue: 9 },
    ]);
  });

  it('rejects incomplete, backdated, inverted and duplicate rows', () => {
    expect(validateTargetRows([row(2025, 1, 2026, null)], 2026)).toContain('needs a Baseline Year');
    expect(validateTargetRows([row(2025, null, 2026, 5)], 2026)).toBe('');
    expect(validateTargetRows([row(null, 3, 2026, 5)], 2026)).toContain('needs a Baseline Year');
    expect(validateTargetRows([row(2024, null, 2025, 5)], 2026)).toContain('must be 2026 or later');
    expect(validateTargetRows([row(2027, null, 2026, 5)], 2026)).toContain('after its baseline year');
    expect(validateTargetRows([row(2025, null, 2026, 5), row(2025, null, 2026, 6)], 2026)).toContain('Only one annual target');
  });

  it('offers the year after the latest row, or the current year when there are none', () => {
    expect(nextTargetYear([row(2025, null, 2026, 1), row(2026, null, 2027, 1)], 2026)).toBe(2028);
    expect(nextTargetYear([], 2026)).toBe(2026);
  });
});

describe('deliverable payload', () => {
  const form: Partial<StrategicDeliverable> = {
    id: 'x', serialNumber: 4, priorityArea: 'Safety', indicator: 'Incidents', responsibleDepartment: 'MSR',
    ministry: 'NIMASA', category: 'AGENCY', annualAggregation: 'sum', performanceDirection: 'lower',
    createdAt: 'never', yearlyPerformance: { '2026': { q1: { target: 1, actual: 2 } } },
  };

  it('sends only editable fields, with targets, projections and the baseline derived from the rows', () => {
    const payload = buildDeliverablePayload(form, 2026, [row(2025, 12, 2026, 8), row(2026, null, 2027, 6)]);
    expect(payload.id).toBeUndefined();
    expect(payload.serialNumber).toBeUndefined();
    expect(payload.yearlyPerformance).toBeUndefined();
    expect(payload.baselineYear).toBe(2025);
    expect(payload.baseline2023).toBe(12);
    expect(payload.projections).toEqual({ '2026': 8, '2027': 6 });
    expect(payload.annualTargets?.length).toBe(2);
    expect(payload.outcome).toBe('');
    expect(payload.ministry).toBe('NIMASA');
  });

  it('leaves the ministry out for pages without one', () => {
    expect(buildDeliverablePayload(form, 2026, [], false).ministry).toBeUndefined();
  });

  it('requires the priority area, KPI and department', () => {
    expect(validateDeliverableForm({ ...form, indicator: '' }, 2026, [])).toContain('required fields');
    expect(validateDeliverableForm(form, 1999, [])).toContain('valid Current Year');
    expect(validateDeliverableForm(form, 2026, [])).toBe('');
  });

  it('builds editable rows from an existing deliverable', () => {
    const existing = { ...form, annualTargets: [{ baselineYear: 2025, baselineValue: 3, targetYear: 2026, targetValue: 9 }] } as StrategicDeliverable;
    expect(targetRowsFor(existing, 2026)).toEqual([row(2025, 3, 2026, 9)]);
    expect(targetRowsFor({ ...form, baseline2023: 4 } as StrategicDeliverable, 2026)).toEqual([row(2025, 4, 2026, null)]);
  });
});
