import {
  StrategicDeliverable, AnnualTarget, AnnualAggregation, PerformanceDirection
} from '../services/strategic-deliverables.service';
import { CATEGORY_LABELS, DeliverableCategory } from '../deliverables-config';

/** Shared KPI performance rules for the deliverables pages (list and report details). */

export const QUARTER_KEYS = ['q1', 'q2', 'q3', 'q4'];

export const AGGREGATION_LABELS: Record<AnnualAggregation, string> = {
  sum: 'Sum of quarters',
  average: 'Average of quarters',
  latest: 'Latest quarter'
};

export const DIRECTION_LABELS: Record<PerformanceDirection, string> = {
  higher: 'Higher is better',
  lower: 'Lower is better (e.g. incidents)'
};

/** Result of comparing an actual against its target, for badges and progress bars. */
export interface Assessment {
  cls: string;
  label: string;
  /** Progress bar width: progress towards target, or for missed lower-is-better targets, how far off */
  width: number;
  /** e.g. "+3 above target" when a lower-is-better target is missed */
  deviation: string;
}

export interface YearSummary {
  actual: number | null;
  target: number | null;
  /** Quarters that make up the actual, e.g. "Q1–Q2" */
  quarters: string;
  method: AnnualAggregation;
}

export interface QuarterFigures {
  key: string;
  target: number;
  actual: number;
}

/** The year the KPI was registered for (the "Current Year" entered on creation). */
export function getReportYear(p: Partial<StrategicDeliverable>): number | null {
  return p.baselineYear ? Number(p.baselineYear) + 1 : null;
}

/** Years a KPI is active in: its report year, any year with an annual target, and any year with reports. */
export function getActiveYears(p: StrategicDeliverable): number[] {
  const years = new Set<number>();
  const reportYear = getReportYear(p);
  if (reportYear) years.add(reportYear);
  Object.keys(p.projections || {}).forEach(y => years.add(Number(y)));
  (p.annualTargets || []).forEach(t => years.add(Number(t.targetYear)));
  Object.keys(p.yearlyPerformance || {}).forEach(y => years.add(Number(y)));
  return [...years].filter(y => !isNaN(y)).sort((a, b) => a - b);
}

/** Whether a deliverable belongs on a page for this year (deliverables with no years at all always do). */
export function isActiveInYear(p: StrategicDeliverable, year: number): boolean {
  const active = getActiveYears(p);
  return active.length === 0 || active.includes(year);
}

export function getAnnualTarget(p: StrategicDeliverable, year: string | number): number | null {
  const target = (p.annualTargets || []).find(t => Number(t.targetYear) === Number(year));
  if (target) return target.targetValue;
  const value = p.projections?.[year.toString()];
  return value === undefined || value === null ? null : value;
}

/** Annual targets for display; older records that only have projections get their baseline inferred where possible. */
export function getAnnualTargets(p: StrategicDeliverable): AnnualTarget[] {
  if (p.annualTargets?.length) {
    return [...p.annualTargets].sort((a, b) => a.targetYear - b.targetYear);
  }
  return Object.entries(p.projections || {})
    .map(([year, value]) => {
      const targetYear = Number(year);
      const baselineYear = targetYear - 1;
      return {
        baselineYear,
        baselineValue: baselineYear === p.baselineYear ? p.baseline2023 ?? null : null,
        targetYear,
        targetValue: value
      };
    })
    .sort((a, b) => a.targetYear - b.targetYear);
}

/** Quarter entries (q1..q4) reported for a year, in quarter order. */
export function getQuarters(p: StrategicDeliverable, year: string | number): QuarterFigures[] {
  const perf = p.yearlyPerformance?.[year.toString()] || {};
  return QUARTER_KEYS.filter(k => perf[k]).map(k => ({ key: k, target: perf[k].target, actual: perf[k].actual }));
}

export function getAggregation(p: Partial<StrategicDeliverable>): AnnualAggregation {
  return p.annualAggregation || 'sum';
}

export function getAggregationLabel(p: Partial<StrategicDeliverable>): string {
  return AGGREGATION_LABELS[getAggregation(p)];
}

/** Combines quarterly values into an annual figure using the KPI's method (mirrors the backend). */
function combine(method: AnnualAggregation, values: number[]): number {
  if (method === 'latest') return values[values.length - 1];
  const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
  return method === 'average' ? Math.round((total / values.length) * 100) / 100 : total;
}

/**
 * The year's result built from its quarterly reports, against the annual target
 * (or, when no annual target is set, the quarterly targets combined the same way).
 */
export function getYearSummary(p: StrategicDeliverable, year: string | number): YearSummary | null {
  const method = getAggregation(p);
  const target = getAnnualTarget(p, year);
  const quarters = getQuarters(p, year);
  if (quarters.length === 0) {
    return target === null ? null : { actual: null, target, quarters: '', method };
  }
  const first = quarters[0].key.toUpperCase();
  const last = quarters[quarters.length - 1].key.toUpperCase();
  return {
    actual: combine(method, quarters.map(q => q.actual)),
    target: target ?? combine(method, quarters.map(q => q.target)),
    quarters: first === last ? first : `${first}–${last}`,
    method
  };
}

/**
 * Baseline that applies to the selected year: the annual target row for that year, else the
 * previous year's actual, else the KPI's original baseline if it was measured the year before.
 */
export function getBaselineForYear(p: StrategicDeliverable, year: string | number): { label: string; value: number | null } | null {
  const y = Number(year);
  const row = getAnnualTargets(p).find(t => t.targetYear === y);
  if (row && row.baselineValue !== null && row.baselineValue !== undefined) {
    return { label: `${row.baselineYear}`, value: row.baselineValue };
  }
  const previousActual = getYearSummary(p, y - 1)?.actual;
  if (previousActual !== null && previousActual !== undefined) {
    return { label: `${y - 1} actual`, value: previousActual };
  }
  if (p.baselineYear === y - 1 && p.baseline2023 !== null && p.baseline2023 !== undefined) {
    return { label: `${p.baselineYear}`, value: p.baseline2023 };
  }
  return row ? { label: `${row.baselineYear}`, value: null } : null;
}

export function isLowerBetter(p: Partial<StrategicDeliverable>): boolean {
  return p.performanceDirection === 'lower';
}

export function getDirectionLabel(p: Partial<StrategicDeliverable>): string {
  return DIRECTION_LABELS[isLowerBetter(p) ? 'lower' : 'higher'];
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as DeliverableCategory] ?? category;
}

/**
 * Compares an actual with its target for a year (or one quarter of it).
 * Better than target is "Target Surpassed" and exactly on target is "Target Met", in either
 * direction (for "lower is better", 0 or 1 against a target of 2 is surpassed).
 * Short of target:
 * - Higher is better: % of target achieved (>=90% on track, >=60% at risk, else off track).
 * - Lower is better: graded by the excess as a share of the gap between baseline and target
 *   (<=25% minor, <=50% moderate, else severe).
 */
export function assess(p: StrategicDeliverable, actual: number | null | undefined, target: number | null | undefined,
                       year: string | number, quarter = false): Assessment {
  const na: Assessment = { cls: 'status-na', label: 'N/A', width: 0, deviation: '' };
  if (actual === null || actual === undefined || target === null || target === undefined) return na;

  const lower = isLowerBetter(p);
  const round = (n: number) => Math.round(n * 100) / 100;
  /** e.g. 5000 -> "5,000", 1.33 -> "1.33" */
  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  // How much better than target the result is: positive = better, negative = worse
  const margin = round(lower ? target - actual : actual - target);

  if (margin > 0) {
    const deviation = lower ? `${fmt(margin)} below target` : `+${fmt(margin)} above target`;
    return { cls: 'status-surpassed', label: 'Target Surpassed', width: 100, deviation };
  }
  if (margin === 0) return { cls: 'status-on-track', label: 'Target Met', width: 100, deviation: '' };

  if (!lower) {
    // Short of a positive target (a target of 0 or less is always met or surpassed above)
    const deviation = `${fmt(-margin)} short of target`;
    const pct = target > 0 ? (actual / target) * 100 : 0;
    const width = Math.min(100, Math.max(0, pct));
    if (pct >= 90) return { cls: 'status-on-track', label: 'On Track', width, deviation };
    if (pct >= 60) return { cls: 'status-at-risk', label: 'At Risk', width, deviation };
    return { cls: 'status-off-track', label: 'Off Track', width, deviation };
  }

  const excess = -margin;
  const deviation = `+${fmt(excess)} above target`;
  let baseline = getBaselineForYear(p, year)?.value ?? null;
  // A quarter is measured against a quarter's share of an annual baseline when quarters are summed
  if (quarter && baseline !== null && getAggregation(p) === 'sum') baseline = baseline / 4;
  const range = baseline !== null && baseline > target ? baseline - target : (target > 0 ? target : null);
  if (range === null) {
    // No baseline to scale against: any excess counts as a severe miss
    return { cls: 'status-severe', label: 'Missed – Severe', width: 100, deviation };
  }
  const share = excess / range;
  const width = Math.min(100, Math.max(8, share * 100));
  if (share <= 0.25) return { cls: 'status-at-risk', label: 'Missed – Minor', width, deviation };
  if (share <= 0.5) return { cls: 'status-off-track', label: 'Missed – Moderate', width, deviation };
  return { cls: 'status-severe', label: 'Missed – Severe', width, deviation };
}
