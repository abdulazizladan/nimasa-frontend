import { StrategicDeliverable, AnnualTarget } from '../services/strategic-deliverables.service';
import { getAnnualTargets } from './kpi-performance';

/** Rules behind the create/edit deliverable form, kept as plain functions so they can be tested. */

/** One editable annual target row (inputs may be empty while typing). */
export interface AnnualTargetRow {
  baselineYear: number | null;
  baselineValue: number | null;
  targetYear: number | null;
  targetValue: number | null;
}

export const isBlank = (v: unknown): boolean => v === null || v === undefined || v === '';

/** Fields the user can edit; everything else (id, serial number, timestamps, yearlyPerformance) is server-owned. */
export const EDITABLE_FIELDS: (keyof StrategicDeliverable)[] = [
  'ministry', 'priorityArea', 'outcome', 'deliverable', 'baselineType', 'indicator',
  'baselineYear', 'baseline2023', 'projections', 'annualTargets', 'annualAggregation', 'performanceDirection',
  'responsibleDepartment', 'supportingEvidence', 'evidenceFile', 'category'
];

export function newTargetRow(targetYear: number, baselineValue: number | null = null): AnnualTargetRow {
  return { baselineYear: targetYear - 1, baselineValue, targetYear, targetValue: null };
}

/** The rows to show when editing a deliverable: its targets, or one empty row for its report year. */
export function targetRowsFor(p: StrategicDeliverable, currentYear: number): AnnualTargetRow[] {
  const rows = getAnnualTargets(p).map(t => ({
    baselineYear: t.baselineYear,
    baselineValue: t.baselineValue ?? null,
    targetYear: t.targetYear,
    targetValue: t.targetValue
  }));
  return rows.length ? rows : [newTargetRow(currentYear, p.baseline2023 ?? null)];
}

/** Rows the user has filled in (a row with neither a baseline nor a target value is ignored). */
export function filledTargetRows(rows: AnnualTargetRow[]): AnnualTargetRow[] {
  return rows.filter(t => !isBlank(t.targetValue) || !isBlank(t.baselineValue));
}

export function rowsToAnnualTargets(rows: AnnualTargetRow[]): AnnualTarget[] {
  return filledTargetRows(rows)
    .map(t => ({
      baselineYear: Number(t.baselineYear),
      baselineValue: isBlank(t.baselineValue) ? null : Number(t.baselineValue),
      targetYear: Number(t.targetYear),
      targetValue: Number(t.targetValue)
    }))
    .sort((a, b) => a.targetYear - b.targetYear);
}

/** The next target year to offer: one after the latest row, or the current year when there are none. */
export function nextTargetYear(rows: AnnualTargetRow[], currentYear: number): number {
  const used = rows.map(t => Number(t.targetYear)).filter(y => !isNaN(y) && y > 0);
  return used.length ? Math.max(...used) + 1 : currentYear;
}

/** An error message for the first invalid annual target row, or '' if all are valid. */
export function validateTargetRows(rows: AnnualTargetRow[], currentYear: number): string {
  const seen = new Set<number>();
  for (const t of filledTargetRows(rows)) {
    const baselineYear = Number(t.baselineYear);
    const targetYear = Number(t.targetYear);
    if (isBlank(t.baselineYear) || isBlank(t.targetYear) || isBlank(t.targetValue)) {
      return 'Each annual target needs a Baseline Year, Target Year and Target Value.';
    }
    if (targetYear < currentYear) return `Target year ${targetYear} must be ${currentYear} or later.`;
    if (targetYear <= baselineYear) return `Target year ${targetYear} must be after its baseline year ${baselineYear}.`;
    if (seen.has(targetYear)) return `Only one annual target is allowed for ${targetYear}.`;
    seen.add(targetYear);
  }
  return '';
}

/** Validates the whole form; returns the first problem or ''. */
export function validateDeliverableForm(form: Partial<StrategicDeliverable>, currentYear: number, rows: AnnualTargetRow[]): string {
  if (!form.priorityArea || !form.indicator || !form.responsibleDepartment) {
    return 'Please fill in all required fields (Strategic Priority Area, KPI/Indicator, Responsible Department).';
  }
  if (!currentYear || currentYear < 2000 || currentYear > 2100) return 'Please enter a valid Current Year.';
  return validateTargetRows(rows, currentYear);
}

/**
 * Builds the request body from the form: only editable fields, with the right types, the annual
 * targets from the rows, and the KPI-level baseline taken from the row for the year before the
 * current year (else the earliest row with a baseline).
 */
export function buildDeliverablePayload(
  form: Partial<StrategicDeliverable>, currentYear: number, rows: AnnualTargetRow[], includeMinistry = true
): Partial<StrategicDeliverable> {
  const payload: Partial<StrategicDeliverable> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key === 'ministry' && !includeMinistry) continue;
    const value = form[key];
    if (value !== undefined) (payload as Record<string, unknown>)[key] = value;
  }
  payload.baselineYear = Number(currentYear) - 1;
  payload.annualTargets = rowsToAnnualTargets(rows);
  payload.projections = Object.fromEntries(payload.annualTargets.map(t => [t.targetYear.toString(), t.targetValue]));
  const baselineTarget = payload.annualTargets.find(t => t.baselineYear === payload.baselineYear)
    ?? payload.annualTargets.find(t => t.baselineValue !== null);
  if (baselineTarget && baselineTarget.baselineValue !== null && baselineTarget.baselineValue !== undefined) {
    payload.baseline2023 = baselineTarget.baselineValue;
  }
  // Required strings on the backend; send empty strings rather than nulls
  payload.outcome = payload.outcome ?? '';
  payload.deliverable = payload.deliverable ?? '';
  payload.supportingEvidence = payload.supportingEvidence ?? '';
  return payload;
}
