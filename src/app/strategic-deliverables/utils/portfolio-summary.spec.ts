import {
  periodLabel, previousPeriod, assessForPeriod, latestReportedQuarter,
  applyFilters, summariseFamilies, uniqueItems, ownerOf, statusByGroup, goodBreakdown, lastEndedQuarter,
  overdueReports, readinessChecks, quarterTrend, quartersWithTrendData, summaryCsv, departmentCodeFor,
  ORGANIZATION_WIDE, NO_OWNER
} from './portfolio-summary';
import { PRESIDENTIAL_CONFIG, MINISTERIAL_CONFIG, AGENCY_CONFIG } from '../deliverables-config';
import { SourceDeliverables } from '../services/all-deliverables.service';
import { StrategicDeliverable } from '../services/strategic-deliverables.service';

const YEAR = 2026;
/** 28 Oct 2026: Q1-Q3 have ended, Q4 hasn't */
const TODAY = new Date(2026, 9, 28);
const departments = [{ code: 'MSR', name: 'Marine Safety and Security' }, { code: 'FLG', name: 'Flag State Control' }];

let nextId = 1;
function deliverable(fields: Partial<StrategicDeliverable>): StrategicDeliverable {
  return {
    id: `d${nextId++}`, serialNumber: nextId, category: 'PRESIDENTIAL_PRIORITY', ministry: 'NIMASA', priorityArea: 'Safety',
    outcome: 'Outcome', deliverable: '', indicator: 'KPI', baselineType: '', baselineYear: YEAR - 1,
    responsibleDepartment: 'Marine Safety and Security', supportingEvidence: '', createdAt: '', updatedAt: '',
    ...fields,
  } as StrategicDeliverable;
}
const target = (value: number) => [{ baselineYear: YEAR - 1, baselineValue: 0, targetYear: YEAR, targetValue: value }];
const quarters = (q: Record<string, [number, number]>) =>
  ({ [YEAR]: Object.fromEntries(Object.entries(q).map(([k, [t, a]]) => [k, { target: t, actual: a }])) });

// Presidential: one surpassed (sum 120 vs 100), one off track (30 vs 100), one shared with ministerial ("Both")
const surpassed = deliverable({ annualTargets: target(100), performanceDirection: 'higher',
  yearlyPerformance: quarters({ q1: [25, 60], q2: [25, 60] }) });
const offTrack = deliverable({ annualTargets: target(100), performanceDirection: 'higher', responsibleDepartment: 'Flag State Control',
  yearlyPerformance: quarters({ q1: [25, 10], q2: [25, 10], q3: [25, 10] }) });
// Latest quarter 10 against a target of 10: exactly met
const both = deliverable({ category: 'BOTH', annualTargets: target(10), performanceDirection: 'higher', annualAggregation: 'latest',
  yearlyPerformance: quarters({ q1: [10, 10], q2: [10, 10], q3: [10, 10] }) });
// Agency: organization-wide with nothing set; one owned by a non-department
const agencyEmpty = deliverable({ category: 'AGENCY', responsibleDepartment: 'NIMASA', priorityArea: 'Governance' });
const agencyOdd = deliverable({ category: 'AGENCY', responsibleDepartment: 'Operations', priorityArea: 'Governance' });

const results: SourceDeliverables[] = [
  { source: PRESIDENTIAL_CONFIG, deliverables: [surpassed, offTrack, both], failed: false },
  { source: MINISTERIAL_CONFIG, deliverables: [both], failed: false },
  { source: AGENCY_CONFIG, deliverables: [agencyEmpty, agencyOdd], failed: false },
];
const families = summariseFamilies(results, YEAR);
const items = uniqueItems(families);

describe('owners and filters', () => {
  it('names owners as the dashboard shows them', () => {
    expect(ownerOf(agencyEmpty)).toBe(ORGANIZATION_WIDE);
    expect(ownerOf(deliverable({ responsibleDepartment: '' }))).toBe(NO_OWNER);
    expect(ownerOf(offTrack)).toBe('Flag State Control');
  });

  it('lists each deliverable once, even when it is on two pages', () => {
    expect(items.map(i => i.deliverable.id)).toEqual([surpassed.id, offTrack.id, both.id, agencyEmpty.id, agencyOdd.id]);
  });

  it('filters by page and by owner', () => {
    const agencyOnly = applyFilters(results, { type: 'agency', owner: '' });
    expect(agencyOnly.map(r => r.source.id)).toEqual(['agency']);

    const flag = applyFilters(results, { type: '', owner: 'Flag State Control' });
    expect(flag.flatMap(r => r.deliverables).map(d => d.id)).toEqual([offTrack.id]);
  });

  it('matches department names regardless of case and spacing', () => {
    expect(departmentCodeFor('marine  safety and security', departments)).toBe('MSR');
    expect(departmentCodeFor('Operations', departments)).toBeNull();
  });
});

describe('status breakdowns', () => {
  it('groups status by owner, most off track first', () => {
    const rows = statusByGroup(items, i => ownerOf(i.deliverable));
    expect(rows[0]).toMatchObject({ label: 'Flag State Control', total: 1, counts: { critical: 1 } });
    expect(rows.find(r => r.label === 'Marine Safety and Security')).toMatchObject({ total: 2, counts: { good: 2 } });
  });

  it('splits good results into surpassed, met and on track', () => {
    expect(goodBreakdown(items)).toEqual({ surpassed: 1, met: 1, onTrack: 0 });
  });
});

describe('overdue reports', () => {
  it('finds the latest quarter that has ended', () => {
    expect(lastEndedQuarter(2026, TODAY)).toBe(2);     // Q3
    expect(lastEndedQuarter(2025, TODAY)).toBe(3);     // a past year: Q4
    expect(lastEndedQuarter(2027, TODAY)).toBeNull();  // nothing has ended yet
  });

  it('counts missing reports for that quarter by owner', () => {
    const overdue = overdueReports(items, YEAR, departments, TODAY)!;
    expect(overdue.quarter).toBe('Q3');
    expect(overdue.ended.getDate()).toBe(30);
    expect(overdue.daysAgo).toBe(28);
    // surpassed (no Q3) + both agency deliverables
    expect(overdue.missing).toBe(3);
    expect(overdue.expected).toBe(5);
    expect(overdue.byOwner.find(o => o.owner === 'Marine Safety and Security')).toMatchObject({ missing: 1, departmentCode: 'MSR' });
    expect(overdue.byOwner.find(o => o.owner === 'Operations')).toMatchObject({ missing: 1, departmentCode: null });
  });
});

describe('readiness checks', () => {
  const checks = readinessChecks(items, YEAR, departments, TODAY);
  const ids = (key: string) => checks.find(c => c.key === key)?.items.map(i => i.deliverable.id);

  it('flags missing targets, direction, reports and unknown owners', () => {
    expect(ids('no-target')).toEqual([agencyEmpty.id, agencyOdd.id]);
    expect(ids('no-direction')).toEqual([agencyEmpty.id, agencyOdd.id]);
    expect(ids('no-reports')).toEqual([agencyEmpty.id, agencyOdd.id]);
    expect(ids('owner')).toEqual([agencyOdd.id]);
  });

  it('returns nothing when everything is ready', () => {
    const ready = items.filter(i => i.deliverable.performanceDirection);
    expect(readinessChecks(ready, YEAR, departments, TODAY)).toEqual([]);
  });

  it('skips the owner check when departments are unknown', () => {
    expect(readinessChecks(items, YEAR, [], TODAY).some(c => c.key === 'owner')).toBe(false);
  });
});

describe('quarter trend', () => {
  it('gives the share of scored deliverables that were good in each quarter', () => {
    const [presidential, ministerial, agency] = quarterTrend(families, YEAR);
    // Q1: surpassed (60 vs 25) good, offTrack (10 vs 25) not, both (10 vs 10) good
    expect(presidential.values[0]).toBeCloseTo(2 / 3);
    expect(presidential.values[2]).toBeCloseTo(1 / 2);
    expect(presidential.values[3]).toBeNull();
    expect(ministerial.values.slice(0, 3)).toEqual([1, 1, 1]);
    expect(agency.values).toEqual([null, null, null, null]);
    expect(quartersWithTrendData(quarterTrend(families, YEAR))).toBe(3);
  });
});

describe('summary export', () => {
  it('writes one CSV row per deliverable, quoting text with commas', () => {
    const csv = summaryCsv([items[0]], YEAR);
    const [header, row] = csv.trim().split('\r\n');
    expect(header.split(',')).toContain('Q4 actual');
    expect(row).toContain('Target Surpassed');
    expect(summaryCsv([{ ...items[0], deliverable: { ...surpassed, indicator: 'Ports, harbours' } }], YEAR))
      .toContain('"Ports, harbours"');
  });
});

describe('periods', () => {
  it('names and steps back through periods', () => {
    expect(periodLabel({ year: 2026, quarter: 2 })).toBe('Q3 2026');
    expect(periodLabel({ year: 2026, quarter: null })).toBe('2026');
    expect(previousPeriod({ year: 2026, quarter: 2 })).toEqual({ year: 2026, quarter: 1 });
    expect(previousPeriod({ year: 2026, quarter: 0 })).toEqual({ year: 2025, quarter: 3 });
    expect(previousPeriod({ year: 2026, quarter: null })).toEqual({ year: 2025, quarter: null });
  });

  it("scores a quarter on that quarter's result against that quarter's target", () => {
    // offTrack: 10 against 25 in each quarter
    expect(assessForPeriod(offTrack, PRESIDENTIAL_CONFIG, { year: YEAR, quarter: 0 }).summary).toMatchObject({ actual: 10, target: 25, quarters: 'Q1' });
    // surpassed: Q1 60 against 25
    expect(assessForPeriod(surpassed, PRESIDENTIAL_CONFIG, { year: YEAR, quarter: 0 }).assessment.label).toBe('Target Surpassed');
    // no Q3 report
    expect(assessForPeriod(surpassed, PRESIDENTIAL_CONFIG, { year: YEAR, quarter: 2 }).status).toBe('none');
  });

  it('scores whole pages for a quarter', () => {
    const q3 = summariseFamilies(results, YEAR, 2);
    expect(q3[0].counts).toMatchObject({ good: 1, critical: 1, none: 1 });
  });

  it('finds the most recent quarter with results', () => {
    expect(latestReportedQuarter(results)).toEqual({ year: YEAR, quarter: 2 });
  });
});
