import { Component, computed, inject, input } from '@angular/core';
import { GlobalStateService } from '../../services/global-state.service';
import { yearOptions } from '../../years';

let nextId = 0;

/**
 * The app-wide year picker. Reads and writes GlobalStateService, so every page agrees on the
 * year. Pass `extraYears` to add years that appear in the page's data.
 */
@Component({
  selector: 'app-year-select',
  standalone: true,
  template: `
    <div class="field year-select">
      <label [for]="id">{{ label() }}</label>
      <select [id]="id" (change)="onChange($any($event.target).value)">
        @for (y of years(); track y) {
          <option [value]="y" [selected]="y === state.selectedYear()">{{ y }}</option>
        }
      </select>
    </div>
  `,
  styles: [`
    :host { display: block; }
    /* Same height as a button, so the two line up when they sit side by side */
    .year-select select { width: auto; min-width: 104px; height: var(--control-h); padding: 0 12px; font-size: var(--fs-md); }
  `],
})
export class YearSelect {
  state = inject(GlobalStateService);
  label = input('Year');
  extraYears = input<number[]>([]);
  readonly id = `year-select-${nextId++}`;

  years = computed(() => yearOptions([...this.extraYears(), this.state.selectedYear()]));

  onChange(value: string): void {
    this.state.setYear(Number(value));
  }
}
