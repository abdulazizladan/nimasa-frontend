import { StrategicDeliverable } from '../services/strategic-deliverables.service';
import { SourceDeliverables, DepartmentRef } from '../services/all-deliverables.service';
import { DeliverablesConfig, AGENCY_CONFIG, CATEGORY_LABELS } from '../deliverables-config';
import {
  assess, getYearSummary, getAnnualTarget, getQuarters, getAggregation, getAggregationLabel, isActiveInYear, isLowerBetter,
  QUARTER_KEYS, Assessment, YearSummary
} from './kpi-performance';

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

// ── Periods: a full year, or one quarter of it ──

export interface Period {
  year: number;
  /** null = full year; 0-3 = Q1-Q4 */
  quarter: number | null;
}

/** e.g. "Q3 2026" or "2026" */
export function periodLabel(period: Period): string {
  return period.quarter === null ? String(period.year) : `Q${period.quarter + 1} ${period.year}`;
}

/** The period before: the previous quarter (Q1 goes back to Q4 of last year), or the previous year. */
export function previousPeriod(period: Period): Period {
  if (period.quarter === null) return { year: period.year - 1, quarter: null };
  return period.quarter === 0 ? { year: period.year - 1, quarter: 3 } : { year: period.year, quarter: period.quarter - 1 };
}

/**
 * A deliverable's result for a period. For a full year it is the year's figure against the annual
 * target; for a quarter, that quarter's result against that quarter's target.
 */
export function assessForPeriod(deliverable: StrategicDeliverable, source: DeliverablesConfig, period: Period): AssessedDeliverable {
  if (period.quarter === null) return assessForYear(deliverable, source, period.year);
  const key = QUARTER_KEYS[period.quarter];
  const entry = deliverable.yearlyPerformance?.[String(period.year)]?.[key];
  const summary: YearSummary | null = entry
    ? { actual: entry.actual ?? null, target: entry.target ?? null, quarters: key.toUpperCase(), method: getAggregation(deliverable) }
    : null;
  const assessment = assess(deliverable, summary?.actual, summary?.target, period.year, true);
  return { deliverable, source, summary, assessment, status: statusClassOf(assessment.cls) };
}

/** The most recent quarter with any reported result, across all deliverables; null if none. */
export function latestReportedQuarter(results: SourceDeliverables[]): Period | null {
  let best: Period | null = null;
  for (const { deliverables } of results) {
    for (const d of deliverables) {
      for (const [year, perf] of Object.entries(d.yearlyPerformance || {})) {
        QUARTER_KEYS.forEach((key, q) => {
          if (!(perf as any)?.[key]) return;
          const y = Number(year);
          if (!best || y > best.year || (y === best.year && q > (best.quarter ?? -1))) best = { year: y, quarter: q };
        });
      }
    }
  }
  return best;
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

/** Per page: the deliverables active in the year, scored for the full year or for one quarter of it. */
export function summariseFamilies(results: SourceDeliverables[], year: number, quarter: number | null = null): FamilySummary[] {
  return results.map(({ source, deliverables, failed }) => {
    const items = deliverables
      .filter(d => isActiveInYear(d, year))
      .map(d => assessForPeriod(d, source, { year, quarter }));
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

// ── Owners and filters ──

/** Owner label for organization-wide deliverables (stored as "NIMASA") */
export const ORGANIZATION_WIDE = 'Organization-wide';
/** Owner label for deliverables with no responsible department */
export const NO_OWNER = 'No owner set';

/** Who a deliverable belongs to, as shown on the dashboard: a department, organization-wide, or no owner. */
export function ownerOf(d: StrategicDeliverable): string {
  const dept = (d.responsibleDepartment || '').trim();
  if (!dept) return NO_OWNER;
  if (dept.toLowerCase() === AGENCY_CONFIG.organizationWide!.value.toLowerCase()) return ORGANIZATION_WIDE;
  return dept;
}

export interface DashboardFilters {
  /** Deliverables page id ('presidential', 'ministerial', 'agency'), or '' for all */
  type: string;
  /** Owner label from ownerOf(), or '' for all */
  owner: string;
}

/** Keeps only the selected page and owner; every dashboard panel is built from the result. */
export function applyFilters(results: SourceDeliverables[], filters: DashboardFilters): SourceDeliverables[] {
  return results
    .filter(r => !filters.type || r.source.id === filters.type)
    .map(r => ({ ...r, deliverables: filters.owner ? r.deliverables.filter(d => ownerOf(d) === filters.owner) : r.deliverables }));
}

/** Each deliverable once ("Both" ones are on two pages; the first page, presidential, wins). */
export function uniqueItems(families: FamilySummary[]): AssessedDeliverable[] {
  const seen = new Set<string>();
  const items: AssessedDeliverable[] = [];
  for (const family of families) {
    for (const item of family.items) {
      if (seen.has(item.deliverable.id)) continue;
      seen.add(item.deliverable.id);
      items.push(item);
    }
  }
  return items;
}

/** Department code for an owner, when the owner is a real department (case and spacing ignored). */
export function departmentCodeFor(owner: string, departments: DepartmentRef[]): string | null {
  const key = owner.trim().replace(/\s+/g, ' ').toLowerCase();
  return departments.find(d => d.name.trim().replace(/\s+/g, ' ').toLowerCase() === key)?.code ?? null;
}

// ── Grouped status (by department, by priority area) ──

export interface StatusRow {
  label: string;
  counts: StatusCounts;
  total: number;
  /** Department code when the row is a department (for linking) */
  departmentCode?: string | null;
  /** Set to false for a row that opens nothing when the bars are clickable */
  clickable?: boolean;
}

/** Status counts per group, most off track first, then most at risk, then largest. */
export function statusByGroup(items: AssessedDeliverable[], groupOf: (i: AssessedDeliverable) => string): StatusRow[] {
  const groups = new Map<string, AssessedDeliverable[]>();
  for (const item of items) {
    const key = groupOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([label, groupItems]) => ({ label, counts: countStatuses(groupItems), total: groupItems.length }))
    .sort((a, b) => b.counts.critical - a.counts.critical || b.counts.warning - a.counts.warning
      || b.total - a.total || a.label.localeCompare(b.label));
}

// ── Surpassed / met / on track split ──

export interface GoodBreakdown {
  surpassed: number;
  met: number;
  onTrack: number;
}

export function goodBreakdown(items: AssessedDeliverable[]): GoodBreakdown {
  return {
    surpassed: items.filter(i => i.assessment.label === 'Target Surpassed').length,
    met: items.filter(i => i.assessment.label === 'Target Met').length,
    onTrack: items.filter(i => i.assessment.label === 'On Track').length,
  };
}

// ── Overdue reports ──

/** The latest quarter (0-3) of the year that has ended, or null if none has. */
export function lastEndedQuarter(year: number, today = new Date()): number | null {
  for (let q = 3; q >= 0; q--) {
    if (isQuarterDue(year, q, today)) return q;
  }
  return null;
}

export interface OverdueReports {
  quarter: string;
  /** Last day of the quarter */
  ended: Date;
  daysAgo: number;
  missing: number;
  expected: number;
  /** Missing reports per owner, most first */
  byOwner: { owner: string; missing: number; departmentCode: string | null }[];
}

/** Who still owes a report for the most recent quarter that has ended; null if no quarter has ended. */
export function overdueReports(items: AssessedDeliverable[], year: number, departments: DepartmentRef[],
                               today = new Date()): OverdueReports | null {
  const q = lastEndedQuarter(year, today);
  if (q === null) return null;
  const key = QUARTER_KEYS[q];
  const ended = new Date(year, (q + 1) * 3, 0);
  const missingItems = items.filter(i => !i.deliverable.yearlyPerformance?.[year.toString()]?.[key]);
  const byOwner = new Map<string, number>();
  for (const item of missingItems) {
    const owner = ownerOf(item.deliverable);
    byOwner.set(owner, (byOwner.get(owner) ?? 0) + 1);
  }
  return {
    quarter: key.toUpperCase(),
    ended,
    daysAgo: Math.max(0, Math.floor((today.getTime() - ended.getTime()) / 86400000)),
    missing: missingItems.length,
    expected: items.length,
    byOwner: [...byOwner.entries()]
      .map(([owner, missing]) => ({ owner, missing, departmentCode: departmentCodeFor(owner, departments) }))
      .sort((a, b) => b.missing - a.missing || a.owner.localeCompare(b.owner)),
  };
}

// ── Data readiness ──

export interface ReadinessCheck {
  key: 'no-target' | 'no-direction' | 'no-reports' | 'owner';
  label: string;
  /** What the problem means and how to fix it */
  detail: string;
  items: AssessedDeliverable[];
}

/**
 * What stops deliverables from being scored for the year. Only checks with problems are returned;
 * an empty list means everything is ready. The owner check runs only when departments are known.
 */
export function readinessChecks(items: AssessedDeliverable[], year: number, departments: DepartmentRef[],
                                today = new Date()): ReadinessCheck[] {
  const anyQuarterDue = lastEndedQuarter(year, today) !== null;
  const checks: ReadinessCheck[] = [
    {
      key: 'no-target',
      label: `No annual target for ${year}`,
      detail: "Without a target, results can't be called met or missed. Fix: Edit the deliverable, then Annual Targets.",
      items: items.filter(i => getAnnualTarget(i.deliverable, year) === null),
    },
    {
      key: 'no-direction',
      label: 'Performance direction never set',
      detail: 'These are scored as "higher is better". Incident counts, such as piracy, need "lower is better". Fix: Edit, then Performance Direction.',
      items: items.filter(i => !i.deliverable.performanceDirection),
    },
    {
      key: 'no-reports',
      label: `No report yet in ${year}`,
      detail: 'At least one quarter of the year has ended. Fix: Add Quarterly Report on the deliverable.',
      items: anyQuarterDue ? items.filter(i => getQuarters(i.deliverable, year).length === 0) : [],
    },
    {
      key: 'owner',
      label: "Owner isn't a department",
      detail: "The responsible department doesn't match any department, so it never appears on a department page. Fix: Edit, then choose a department.",
      items: departments.length
        ? items.filter(i => {
            const owner = ownerOf(i.deliverable);
            return owner !== ORGANIZATION_WIDE && departmentCodeFor(owner, departments) === null;
          })
        : [],
    },
  ];
  return checks.filter(c => c.items.length > 0);
}

// ── Quarter-by-quarter trend ──

export interface TrendSeries {
  source: DeliverablesConfig;
  /** Per quarter: share of scored deliverables surpassed, met or on track; null when none were scored */
  values: (number | null)[];
  /** Per quarter: how many deliverables could be scored */
  scored: number[];
}

/** For each page: the share of deliverables surpassed, met or on track in each quarter of the year. */
export function quarterTrend(families: FamilySummary[], year: number): TrendSeries[] {
  return families.map(family => {
    const values: (number | null)[] = [];
    const scored: number[] = [];
    QUARTER_KEYS.forEach(key => {
      let good = 0, count = 0;
      for (const item of family.items) {
        const q = item.deliverable.yearlyPerformance?.[year.toString()]?.[key];
        if (!q) continue;
        const status = statusClassOf(assess(item.deliverable, q.actual, q.target, year, true).cls);
        if (status === 'none') continue;
        count++;
        if (status === 'good') good++;
      }
      scored.push(count);
      values.push(count ? good / count : null);
    });
    return { source: family.source, values, scored };
  });
}

/** Number of quarters with at least one scored deliverable on any page. */
export function quartersWithTrendData(series: TrendSeries[]): number {
  return QUARTER_KEYS.filter((_, q) => series.some(s => s.values[q] !== null)).length;
}

// ── Export ──

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Quarterly summary as CSV: one row per deliverable with its year result and each quarter's figures. */
export function summaryCsv(items: AssessedDeliverable[], year: number): string {
  const header = [
    'Type', 'Serial', 'Deliverable', 'KPI', 'Priority area', 'Owner', 'Direction', 'Annual figure',
    `${year} target`, `${year} actual`, 'Status', 'Difference from target',
    ...QUARTER_KEYS.flatMap(k => [`${k.toUpperCase()} target`, `${k.toUpperCase()} actual`]),
  ];
  const rows = items.map(i => {
    const d = i.deliverable;
    const perf = d.yearlyPerformance?.[year.toString()] || {};
    return [
      CATEGORY_LABELS[d.category] ?? d.category,
      d.serialNumber,
      d.outcome || d.deliverable,
      d.indicator,
      d.priorityArea,
      ownerOf(d),
      isLowerBetter(d) ? 'Lower is better' : 'Higher is better',
      getAggregationLabel(d),
      i.summary?.target,
      i.summary?.actual,
      i.assessment.label,
      i.assessment.deviation,
      ...QUARTER_KEYS.flatMap(k => [perf[k]?.target, perf[k]?.actual]),
    ];
  });
  return [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
