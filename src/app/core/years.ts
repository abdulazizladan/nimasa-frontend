/** The first year the system holds data for */
export const FIRST_YEAR = 2023;

/**
 * Years offered by every year picker: from the first year to next year, plus any extra years
 * found in the data, oldest first. One rule, so all pages agree on which years exist.
 */
export function yearOptions(extra: Iterable<number> = []): number[] {
  const years = new Set<number>();
  for (let y = FIRST_YEAR; y <= new Date().getFullYear() + 1; y++) years.add(y);
  for (const y of extra) if (Number.isFinite(y)) years.add(y);
  return [...years].sort((a, b) => a - b);
}
