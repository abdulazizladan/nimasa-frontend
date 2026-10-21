import { StrategicDeliverable } from '../services/strategic-deliverables.service';
import { SourceDeliverables } from '../services/all-deliverables.service';
import { DeliverablesConfig } from '../deliverables-config';
import { assess, getYearSummary, isActiveInYear, isLowerBetter, QUARTER_KEYS, Assessment, YearSummary } from './kpi-performance';

/**
 * Status summaries across many deliverables (dashboard, department pages).
 *
 * Detailed statuses are grouped into four classes for charts. "Serious" (off track / moderate
 * miss) and "critical" (severe miss) share one class: their colours are too close to tell apart
 * next to "at risk" in a stacked bar. The detailed label is still shown wherever a single
 * deliverable is listed.
 */
export type StatusClass = 'good' | 'warning' | 'critical' | 'none';

export interface StatusClassInfo {
  key: StatusClass;
  label: string;
  /** Shape shown with the colour, so status never relies on colour alone */
  icon: string;
}

/** Display order: best to worst, then no data */
export const STATUS_CLASSES: StatusClassInfo[] = [
  { key: 'good', label: 'Surpassed, met or on track', icon: '✓' },
  { key: 'warning', label: 'At risk / minor miss', icon: '!' },
  { key: 'critical', label: 'Off track / missed', icon: '✕' },
  // No results yet, or results that can't be scored (no target, or a zero target on a "higher is better" KPI)
  { key: 'none', label: 'No data / not scored', icon: '–' },
];

/** Status class for an assessment's CSS class (see kpi-performance assess()). */
export function statusClassOf(cls: string): StatusClass {
  if (cls === 'status-surpassed' || cls === 'status-on-track') return 'good';
  if (cls === 'status-at-risk') return 'warning';
  if (cls === 'status-off-track' || cls === 'status-severe') return 'critical';
  return 'none';
}

/** A deliverable with its result for one year, and the page it opens on. */
export interface AssessedDeliverable {
  deliverable: StrategicDeliverable;
  source: DeliverablesConfig;
  summary: YearSummary | null;
  assessment: Assessment;
  status: StatusClass;
}

export function assessForYear(deliverable: StrategicDeliverable, source: DeliverablesConfig, year: number): AssessedDeliverable {
  const summary = getYearSummary(deliverable, year);
  const assessment = assess(deliverable, summary?.actual, summary?.target, year);
  return { deliverable, source, summary, assessment, status: statusClassOf(assessment.cls) };
}

export type StatusCounts = Record<StatusClass, number>;

export function countStatuses(items: { status: StatusClass }[]): StatusCounts {
  const counts: StatusCounts = { good: 0, warning: 0, critical: 0, none: 0 };
  for (const item of items) counts[item.status]++;
  return counts;
}

/** One deliverables page's status picture for a year (only deliverables active that year, as on the page). */
export interface FamilySummary {
  source: DeliverablesConfig;
  failed: boolean;
  items: AssessedDeliverable[];
  counts: StatusCounts;
  total: number;
  /** Deliverables with a result to judge (total minus "no data") */
  withData: number;
  /** Deliverables that have reported figures for the year, whether or not they could be scored */
  reported: number;
  /** Share of deliverables with data that surpassed, met or are on track for their target; null when none have data */
  onTrackShare: number | null;
}

export function summariseFamilies(results: SourceDeliverables[], year: number): FamilySummary[] {
  return results.map(({ source, deliverables, failed }) => {
    const items = deliverables
      .filter(d => isActiveInYear(d, year))
      .map(d => assessForYear(d, source, year));
    const counts = countStatuses(items);
    const withData = items.length - counts.none;
    return {
      source,
      failed,
      items,
      counts,
      total: items.length,
      withData,
      reported: items.filter(i => i.summary?.actual !== null && i.summary?.actual !== undefined).length,
      onTrackShare: withData ? counts.good / withData : null
    };
  });
}

/** Whether a quarter's report is due yet (the quarter has ended). */
export function isQuarterDue(year: number, quarterIndex: number, today = new Date()): boolean {
  const quarterEnd = new Date(year, (quarterIndex + 1) * 3, 1); // first day after the quarter
  return quarterEnd <= today;
}

export interface CompletenessCell {
  quarter: string;
  due: boolean;
  reported: number;
  expected: number;
  /** reported / expected, null when nothing is expected */
  share: number | null;
}

/** For each quarter of the year: how many of the family's deliverables have submitted a report. */
export function reportingCompleteness(family: FamilySummary, year: number, today = new Date()): CompletenessCell[] {
  return QUARTER_KEYS.map((key, index) => {
    const expected = family.items.length;
    const reported = family.items.filter(i => !!i.deliverable.yearlyPerformance?.[year.toString()]?.[key]).length;
    return {
      quarter: key.toUpperCase(),
      due: isQuarterDue(year, index, today),
      reported,
      expected,
      share: expected ? reported / expected : null
    };
  });
}

/** Severity order of the detailed statuses, worst first. */
const SEVERITY: Record<string, number> = {
  'Missed – Severe': 4,
  'Off Track': 3,
  'Missed – Moderate': 3,
  'At Risk': 2,
  'Missed – Minor': 2,
};

/**
 * Deliverables most in need of attention, worst first: by detailed status, then by how far
 * from target (lowest % achieved, or for "lower is better" KPIs the largest excess).
 * Deliverables listed on two pages ("Both") appear once.
 */
export function needsAttention(families: FamilySummary[]): AssessedDeliverable[] {
  const seen = new Set<string>();
  const flagged: AssessedDeliverable[] = [];
  for (const family of families) {
    for (const item of family.items) {
      if (seen.has(item.deliverable.id)) continue;
      seen.add(item.deliverable.id);
      if (item.status === 'warning' || item.status === 'critical') flagged.push(item);
    }
  }
  const distance = (i: AssessedDeliverable) =>
    isLowerBetter(i.deliverable) ? i.assessment.width : 100 - i.assessment.width;
  return flagged.sort((a, b) =>
    (SEVERITY[b.assessment.label] ?? 0) - (SEVERITY[a.assessment.label] ?? 0) || distance(b) - distance(a)
  );
}
