import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  private selectedYearSubject = new BehaviorSubject<number>(new Date().getFullYear());
  public selectedYear$: Observable<number> = this.selectedYearSubject.asObservable();

  constructor() {}

  setYear(year: number): void {
    this.selectedYearSubject.next(year);
  }

  getYear(): number {
    return this.selectedYearSubject.value;
  }
}
