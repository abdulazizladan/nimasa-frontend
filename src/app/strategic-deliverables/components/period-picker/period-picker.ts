import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { GlobalStateService } from '../../../core/services/global-state.service';

/**
 * Year plus Full year / Q1-Q4. Reads and writes the app-wide selection, so every page that
 * shows results agrees on the period.
 */
@Component({
  selector: 'app-period-picker',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="picker">
      <div class="field">
        <label for="period-year">Year</label>
        <select id="period-year" (change)="setYear($any($event.target).value)">
          <option *ngFor="let y of years" [value]="y" [selected]="y === year()">{{ y }}</option>
        </select>
      </div>
      <div class="field">
        <span class="label" id="period-quarter-label">Period</span>
        <div class="toggle" role="group" aria-labelledby="period-quarter-label">
          <button type="button" *ngFor="let q of quarters" [class.on]="q === quarter()" [attr.aria-pressed]="q === quarter()"
            (click)="setQuarter(q)">{{ q === null ? 'Full year' : 'Q' + (q + 1) }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .picker { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: flex-end; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    label, .label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    select { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff; font: inherit; font-size: 13px; color: #1e293b; }
    .toggle { display: inline-flex; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff; }
    .toggle button { border: none; border-right: 1px solid #cbd5e1; background: transparent; padding: 7px 12px; font: inherit; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; }
    .toggle button:last-child { border-right: none; }
    .toggle button:hover { background: #f8fafc; }
    .toggle button.on { background: #2563eb; color: #ffffff; }
    .toggle button:focus-visible, select:focus-visible { outline: 2px solid #1e293b; outline-offset: -2px; }
  `],
})
export class PeriodPicker implements OnInit, OnDestroy {
  private globalState = inject(GlobalStateService);
  private subs: Subscription[] = [];

  readonly years = Array.from({ length: new Date().getFullYear() - 2021 }, (_, i) => 2023 + i);
  readonly quarters: (number | null)[] = [null, 0, 1, 2, 3];
  year = signal(this.globalState.getYear());
  quarter = signal<number | null>(this.globalState.getQuarter());

  ngOnInit(): void {
    this.subs.push(this.globalState.selectedYear$.subscribe(y => this.year.set(y)));
    this.subs.push(this.globalState.selectedQuarter$.subscribe(q => this.quarter.set(q)));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  setYear(value: string): void {
    this.globalState.setYear(Number(value));
  }

  setQuarter(q: number | null): void {
    this.globalState.setQuarter(q);
  }
}
