import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { yearOptions } from '../../../core/years';

let nextId = 0;

/**
 * Year plus Full year / Q1-Q4. Reads and writes the app-wide selection, so every page that
 * shows results agrees on the period.
 */
@Component({
  selector: 'app-period-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="picker">
      <div class="field">
        <label [for]="id">Year</label>
        <select [id]="id" (change)="setYear($any($event.target).value)">
          @for (y of years(); track y) {
            <option [value]="y" [selected]="y === state.selectedYear()">{{ y }}</option>
          }
        </select>
      </div>
      <div class="field">
        <span class="label" [id]="id + '-period'">Period</span>
        <div class="toggle" role="group" [attr.aria-labelledby]="id + '-period'">
          @for (q of quarters; track q) {
            <button type="button" [class.on]="q === state.selectedQuarter()" [attr.aria-pressed]="q === state.selectedQuarter()"
              (click)="state.setQuarter(q)">{{ q === null ? 'Full year' : 'Q' + (q + 1) }}</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .picker { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: flex-end; }
    .field select { width: auto; min-width: 96px; font-size: var(--fs-sm); padding: 7px 10px; }
    .toggle { display: inline-flex; border: 1px solid var(--border-strong); border-radius: var(--r-md); overflow: hidden; background: var(--surface); }
    .toggle button { border: none; border-right: 1px solid var(--border-strong); background: transparent; padding: 7px 12px; font-size: var(--fs-sm); font-weight: 600; color: var(--text-secondary); }
    .toggle button:last-child { border-right: none; }
    .toggle button:hover { background: var(--surface-muted); }
    .toggle button.on { background: var(--accent); color: var(--text-on-dark); }
    .toggle button:focus-visible { outline-offset: -2px; }
  `],
})
export class PeriodPicker {
  state = inject(GlobalStateService);
  readonly id = `period-picker-${nextId++}`;
  readonly quarters: (number | null)[] = [null, 0, 1, 2, 3];
  years = computed(() => yearOptions([this.state.selectedYear()]));

  setYear(value: string): void {
    this.state.setYear(Number(value));
  }
}
