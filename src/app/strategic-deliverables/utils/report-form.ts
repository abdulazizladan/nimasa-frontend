import { StrategicDeliverable, QuarterlyReport, QuarterlyReportInput } from '../services/strategic-deliverables.service';
import { getActiveYears, getAggregation, getAnnualTarget, getReportYear, QUARTER_KEYS } from './kpi-performance';

/** Rules behind the quarterly report form, kept as plain functions so they can be tested. */

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export interface ReportForm {
  year: number;
  quarter: string;
  targetValue: number | null;
  actualValue: number | null;
  progress: string;
  keyIssues: string;
  mdaEfforts: string;
  comments: string;
}

export function emptyReport(year: number, quarter = 'Q1'): ReportForm {
  return { year, quarter, targetValue: null, actualValue: null, progress: '', keyIssues: '', mdaEfforts: '', comments: '' };
}

export const periodKey = (r: { year: number; quarter: string }): string => `${r.year}-${r.quarter}`;

/** Report years run from the KPI's report year to the latest target year (or next year), plus `include`. */
export function reportYearOptions(p: StrategicDeliverable, fallbackYear: number, include?: number): number[] {
  const active = getActiveYears(p);
  const reportYear = getReportYear(p) ?? fallbackYear;
  const first = Math.min(reportYear, ...active);
  const last = Math.max(new Date().getFullYear() + 1, ...active);
  const years = new Set<number>();
  for (let y = first; y <= last; y++) years.add(y);
  if (include) years.add(include);
  return [...years].sort((a, b) => a - b);
}

/** Whether a report has been saved for this year and quarter. */
export function hasReport(p: StrategicDeliverable, year: number, quarter: string): boolean {
  const key = quarter.toLowerCase() as (typeof QUARTER_KEYS)[number];
  return !!p.yearlyPerformance?.[year.toString()]?.[key];
}

/** First quarter not yet reported for the year, so the form doesn't default to a duplicate. */
export function nextOpenQuarter(p: StrategicDeliverable, year: number): string {
  const perf = p.yearlyPerformance?.[year.toString()] || {};
  const open = QUARTER_KEYS.find(k => !perf[k]);
  return (open || 'q1').toUpperCase();
}

/** Suggests a quarterly target from the annual target: a quarter's share when summed, else the target itself. */
export function suggestedQuarterTarget(p: StrategicDeliverable, year: number): number | null {
  const annual = getAnnualTarget(p, year);
  if (annual === null) return null;
  return getAggregation(p) === 'sum' ? Math.round((annual / 4) * 100) / 100 : annual;
}

/**
 * The form for a period: the saved report if there is one; otherwise a new entry pre-filled with
 * any figures recorded without a full report (older data), or a suggested target.
 */
export function reportFormFor(p: StrategicDeliverable, year: number, quarter: string, saved?: QuarterlyReport): ReportForm {
  if (saved) {
    return {
      year, quarter,
      targetValue: saved.targetValue ?? null,
      actualValue: saved.actualValue ?? null,
      progress: saved.progress || '',
      keyIssues: saved.keyIssues || '',
      mdaEfforts: saved.mdaEfforts || '',
      comments: saved.comments || ''
    };
  }
  const key = quarter.toLowerCase() as (typeof QUARTER_KEYS)[number];
  const summary = p.yearlyPerformance?.[year.toString()]?.[key];
  return {
    ...emptyReport(year, quarter),
    targetValue: summary?.target ?? suggestedQuarterTarget(p, year),
    actualValue: summary?.actual ?? null
  };
}

/** The saved report for a period, if any. */
export function savedReportFor(reports: QuarterlyReport[], year: number, quarter: string): QuarterlyReport | undefined {
  return reports.find(r => Number(r.year) === Number(year) && r.quarter === quarter);
}

/** Converts the form to what the API expects; '' when a required figure is missing. */
export function reportPayload(form: ReportForm): QuarterlyReportInput | string {
  if (form.targetValue === null || form.targetValue === undefined || (form.targetValue as unknown) === ''
    || form.actualValue === null || form.actualValue === undefined || (form.actualValue as unknown) === '') {
    return 'Please fill in the Target and Actual values.';
  }
  return {
    year: Number(form.year),
    quarter: form.quarter,
    targetValue: Number(form.targetValue),
    actualValue: Number(form.actualValue),
    progress: form.progress,
    keyIssues: form.keyIssues,
    mdaEfforts: form.mdaEfforts,
    comments: form.comments
  };
}
