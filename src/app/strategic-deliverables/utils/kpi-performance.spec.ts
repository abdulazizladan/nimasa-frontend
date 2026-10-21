import { assess } from './kpi-performance';
import { StrategicDeliverable } from '../services/strategic-deliverables.service';

const higher = { performanceDirection: 'higher' } as StrategicDeliverable;
const lower = { performanceDirection: 'lower' } as StrategicDeliverable;
const lowerWithBaseline = (baseline: number) => ({
  performanceDirection: 'lower', baselineYear: 2025, baseline2023: baseline
}) as StrategicDeliverable;

describe('assess', () => {
  describe('higher is better', () => {
    it('counts any result above a target of 0 as surpassed, not N/A', () => {
      expect(assess(higher, 5, 0, 2026).label).toBe('Target Surpassed');
      expect(assess(higher, 0, 0, 2026).label).toBe('Target Met');
    });

    it('says when a target is surpassed, e.g. 50 against a target of 40', () => {
      const result = assess(higher, 50, 40, 2026);
      expect(result.label).toBe('Target Surpassed');
      expect(result.deviation).toBe('+10 above target');
    });

    it('says when a target is met exactly', () => {
      expect(assess(higher, 40, 40, 2026).label).toBe('Target Met');
    });

    it('grades results short of target and says by how much', () => {
      expect(assess(higher, 95, 100, 2026)).toMatchObject({ label: 'On Track', deviation: '5 short of target' });
      expect(assess(higher, 70, 100, 2026).label).toBe('At Risk');
      expect(assess(higher, 30, 100, 2026).label).toBe('Off Track');
    });
  });

  describe('lower is better', () => {
    it('counts results under the target as surpassed (0 or 1 against a target of 2)', () => {
      expect(assess(lower, 0, 2, 2026)).toMatchObject({ label: 'Target Surpassed', deviation: '2 below target' });
      expect(assess(lower, 1, 2, 2026).label).toBe('Target Surpassed');
    });

    it('says when a target is met exactly', () => {
      expect(assess(lower, 2, 2, 2026).label).toBe('Target Met');
      expect(assess(lower, 0, 0, 2026).label).toBe('Target Met');
    });

    it('grades misses by how far over target they are, relative to the baseline', () => {
      expect(assess(lowerWithBaseline(40), 8, 0, 2026)).toMatchObject({ label: 'Missed – Minor', deviation: '+8 above target' });
      expect(assess(lowerWithBaseline(40), 15, 0, 2026).label).toBe('Missed – Moderate');
      expect(assess(lowerWithBaseline(40), 30, 0, 2026).label).toBe('Missed – Severe');
    });
  });

  it('is N/A without an actual or a target', () => {
    expect(assess(higher, null, 10, 2026).label).toBe('N/A');
    expect(assess(higher, 10, null, 2026).label).toBe('N/A');
  });
});
