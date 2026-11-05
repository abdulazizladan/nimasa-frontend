import { Injectable, signal } from '@angular/core';

/**
 * App-wide selections shared by every page: the year, and within it the period being looked at
 * (the full year, or one quarter, 0 = Q1 ... 3 = Q4). Both are signals, so components read them
 * directly in templates and computeds without subscribing.
 */
@Injectable({ providedIn: 'root' })
export class GlobalStateService {
  readonly selectedYear = signal<number>(new Date().getFullYear());
  /** null = full year; 0-3 = Q1-Q4 */
  readonly selectedQuarter = signal<number | null>(null);

  setYear(year: number): void {
    if (Number.isFinite(year)) this.selectedYear.set(year);
  }

  getYear(): number {
    return this.selectedYear();
  }

  setQuarter(quarter: number | null): void {
    this.selectedQuarter.set(quarter);
  }

  getQuarter(): number | null {
    return this.selectedQuarter();
  }
}
