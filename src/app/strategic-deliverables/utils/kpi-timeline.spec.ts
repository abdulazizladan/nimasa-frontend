import { kpiTimeline, niceTicks, timelineGeometry, timelineSvg } from './kpi-timeline';
import { StrategicDeliverable } from '../services/strategic-deliverables.service';

const kpi = (yearlyPerformance: Record<string, any>) => ({ id: 'k1', yearlyPerformance } as unknown as StrategicDeliverable);

describe('kpi timeline', () => {
  const d = kpi({
    2025: { q4: { target: 10, actual: 8 } },
    2026: { q1: { target: 10, actual: 12 }, q3: { target: 12, actual: 11 }, annual: { target: 40, actual: 31 } },
  });

  it('runs from the first reported quarter to the last, across years, with gaps for missing quarters', () => {
    const points = kpiTimeline(d);
    expect(points.map(p => p.label)).toEqual(['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026']);
    expect(points[2]).toMatchObject({ actual: null, target: null });
    expect(points[3]).toMatchObject({ actual: 11, target: 12, short: "Q3 '26" });
  });

  it('has nothing to draw without reports', () => {
    expect(kpiTimeline(kpi({}))).toEqual([]);
    expect(timelineSvg(kpi({}))).toBeNull();
  });

  it('breaks the line where a quarter has no report', () => {
    const g = timelineGeometry(kpiTimeline(d));
    expect(g.actualRuns.length).toBe(1);     // Q4 2025 - Q1 2026; Q3 2026 stands alone as a dot
    expect(g.actual.length).toBe(3);
  });

  it('chooses round axis values that cover the data', () => {
    expect(niceTicks(0, 12)).toEqual([0, 5, 10, 15]);
    // Results of 8-12 sit far from zero, so the axis stays tight around them
    const ticks = timelineGeometry(kpiTimeline(d)).ticks.map(t => t.value);
    expect(ticks[0]).toBeLessThanOrEqual(8);
    expect(ticks[0]).toBeGreaterThan(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(12);
  });

  it('starts the axis at zero when the data sits near it', () => {
    const nearZero = kpi({ 2026: { q1: { target: 4, actual: 1 }, q2: { target: 4, actual: 3 } } });
    expect(timelineGeometry(kpiTimeline(nearZero)).ticks[0].value).toBe(0);
  });

  it('draws the same chart as SVG for the PDF', () => {
    const svg = timelineSvg(d)!;
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Actual');
  });
});
