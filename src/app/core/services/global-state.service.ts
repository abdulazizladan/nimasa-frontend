import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * App-wide selections shared by every page: the year, and within it the period being looked at
 * (the full year, or one quarter, 0 = Q1 ... 3 = Q4).
 */
@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  private selectedYearSubject = new BehaviorSubject<number>(new Date().getFullYear());
  public selectedYear$: Observable<number> = this.selectedYearSubject.asObservable();

  /** null = full year; 0-3 = Q1-Q4 */
  private selectedQuarterSubject = new BehaviorSubject<number | null>(null);
  public selectedQuarter$: Observable<number | null> = this.selectedQuarterSubject.asObservable();

  constructor() {}

  setYear(year: number): void {
    this.selectedYearSubject.next(year);
  }

  getYear(): number {
    return this.selectedYearSubject.value;
  }

  setQuarter(quarter: number | null): void {
    this.selectedQuarterSubject.next(quarter);
  }

  getQuarter(): number | null {
    return this.selectedQuarterSubject.value;
  }
}
