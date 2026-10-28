import { StrategicDeliverable } from '../services/strategic-deliverables.service';
import { QUARTER_KEYS, isLowerBetter } from './kpi-performance';

/**
 * A KPI's quarterly results over time, and the geometry to draw them as a line chart.
 * The same geometry draws the on-screen chart (KpiQuarterChart) and the PDF chart (timelineSvg),
 * so both show identical lines.
 */

export interface TimelinePoint {
  year: number;
  /** 0-3 = Q1-Q4 */
  quarter: number;
  /** e.g. "Q3 2026" */
  label: string;
  /** e.g. "Q3 '26", for axis labels */
  short: string;
  actual: number | null;
  target: number | null;
}

/** Every quarter from the KPI's first reported quarter to its last; quarters without a report have nulls. */
export function kpiTimeline(d: StrategicDeliverable): TimelinePoint[] {
  const reported: { index: number; actual: number | null; target: number | null }[] = [];
  for (const [year, perf] of Object.entries(d.yearlyPerformance || {})) {
    QUARTER_KEYS.forEach((key, q) => {
      const entry = (perf as any)?.[key];
      if (!entry) return;
      const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
      reported.push({ index: Number(year) * 4 + q, actual: num(entry.actual), target: num(entry.target) });
    });
  }
  if (!reported.length) return [];
  const first = Math.min(...reported.map(r => r.index));
  const last = Math.max(...reported.map(r => r.index));
  const points: TimelinePoint[] = [];
  for (let index = first; index <= last; index++) {
    const year = Math.floor(index / 4);
    const quarter = index % 4;
    const entry = reported.find(r => r.index === index);
    points.push({
      year, quarter,
      label: `Q${quarter + 1} ${year}`,
      short: `Q${quarter + 1} '${String(year).slice(-2)}`,
      actual: entry?.actual ?? null,
      target: entry?.target ?? null,
    });
  }
  return points;
}

/** Round, evenly spaced axis values covering min..max (about `count` steps). */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) { min -= 1; max += 1; }
  const rough = (max - min) / count;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * power).find(s => s >= rough) ?? 10 * power;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  if (ticks[ticks.length - 1] < max) ticks.push(Math.round((ticks[ticks.length - 1] + step) * 1e6) / 1e6);
  return ticks;
}

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  point: TimelinePoint;
}

export interface TimelineGeometry {
  width: number;
  height: number;
  plot: { left: number; right: number; top: number; bottom: number };
  ticks: { value: number; y: number; label: string }[];
  xLabels: { x: number; text: string }[];
  actual: ChartPoint[];
  target: ChartPoint[];
  /** Polyline point lists, one per unbroken run (a quarter without a report breaks the line) */
  actualRuns: string[];
  targetRuns: string[];
}

const fmtTick = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 2, notation: Math.abs(v) >= 10000 ? 'compact' : 'standard' });

/** Lays out the timeline in a width x height box, with room for axis labels. */
export function timelineGeometry(points: TimelinePoint[], width = 600, height = 240): TimelineGeometry {
  const plot = { left: 52, right: width - 64, top: 16, bottom: height - 30 };
  const values = points.flatMap(p => [p.actual, p.target]).filter((v): v is number => v !== null);
  let min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  // Start at zero when the data sits near it, so small values aren't exaggerated
  if (min >= 0 && min <= max * 0.4) min = 0;
  const tickValues = niceTicks(min, max);
  const lo = tickValues[0];
  const hi = tickValues[tickValues.length - 1];
  const y = (v: number) => plot.bottom - ((v - lo) / (hi - lo || 1)) * (plot.bottom - plot.top);
  const n = points.length;
  const x = (i: number) => n <= 1 ? (plot.left + plot.right) / 2 : plot.left + 12 + i * ((plot.right - plot.left - 24) / (n - 1));

  const series = (key: 'actual' | 'target') => points
    .map((p, i) => (p[key] === null ? null : { x: x(i), y: y(p[key] as number), value: p[key] as number, point: p }))
    .filter((p): p is ChartPoint => p !== null);
  const runs = (key: 'actual' | 'target') => {
    const out: string[] = [];
    let current: string[] = [];
    points.forEach((p, i) => {
      if (p[key] === null) { if (current.length) out.push(current.join(' ')); current = []; return; }
      current.push(`${x(i).toFixed(1)},${y(p[key] as number).toFixed(1)}`);
    });
    if (current.length) out.push(current.join(' '));
    return out.filter(r => r.includes(' '));   // a lone point is drawn as a dot, not a line
  };

  // Label every quarter when there's room, otherwise every other one (always the last)
  const every = n > 8 ? 2 : 1;
  return {
    width, height, plot,
    ticks: tickValues.map(v => ({ value: v, y: y(v), label: fmtTick(v) })),
    xLabels: points.map((p, i) => ({ x: x(i), text: p.short })).filter((_, i) => i % every === 0 || i === n - 1),
    actual: series('actual'),
    target: series('target'),
    actualRuns: runs('actual'),
    targetRuns: runs('target'),
  };
}

const ACTUAL_COLOR = '#2a78d6';
const TARGET_COLOR = '#64748b';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The chart as a standalone SVG string (for the PDF report). */
export function timelineSvg(d: StrategicDeliverable, width = 500, height = 220): string | null {
  const points = kpiTimeline(d);
  if (!points.length) return null;
  const g = timelineGeometry(points, width, height);
  const parts: string[] = [];
  for (const t of g.ticks) {
    parts.push(`<line x1="${g.plot.left}" x2="${g.plot.right}" y1="${t.y}" y2="${t.y}" stroke="#e2e8f0" stroke-width="1"/>`);
    parts.push(`<text x="${g.plot.left - 8}" y="${t.y + 3}" font-size="9" fill="#64748b" text-anchor="end">${esc(t.label)}</text>`);
  }
  for (const l of g.xLabels) {
    parts.push(`<text x="${l.x}" y="${g.plot.bottom + 18}" font-size="9" fill="#64748b" text-anchor="middle">${esc(l.text)}</text>`);
  }
  for (const r of g.targetRuns) parts.push(`<polyline points="${r}" fill="none" stroke="${TARGET_COLOR}" stroke-width="1.5"/>`);
  for (const r of g.actualRuns) parts.push(`<polyline points="${r}" fill="none" stroke="${ACTUAL_COLOR}" stroke-width="2"/>`);
  for (const p of g.target) parts.push(`<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${TARGET_COLOR}"/>`);
  for (const p of g.actual) parts.push(`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${ACTUAL_COLOR}" stroke="#ffffff" stroke-width="1.5"/>`);
  const lastA = g.actual[g.actual.length - 1];
  const lastT = g.target[g.target.length - 1];
  if (lastA) parts.push(`<text x="${lastA.x + 8}" y="${lastA.y + 3}" font-size="9" font-weight="bold" fill="#17211c">Actual</text>`);
  if (lastT && (!lastA || Math.abs(lastT.y - lastA.y) >= 12)) {
    parts.push(`<text x="${lastT.x + 8}" y="${lastT.y + 3}" font-size="9" fill="#475569">Target</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

/** Short caption for the chart, e.g. "Lower is better" */
export function directionNote(d: StrategicDeliverable): string {
  return isLowerBetter(d) ? 'Lower is better' : 'Higher is better';
}
