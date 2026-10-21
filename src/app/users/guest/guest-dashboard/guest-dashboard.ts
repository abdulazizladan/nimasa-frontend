import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { GlobalStateService } from '../../../core/services/global-state.service';

/** Guest home: the deliverables overview (read-only) for the selected year. */
@Component({
  selector: 'app-guest-dashboard',
  standalone: false,
  templateUrl: './guest-dashboard.html',
  styleUrl: './guest-dashboard.css',
})
export class GuestDashboard implements OnInit, OnDestroy {
  private globalState = inject(GlobalStateService);
  private sub?: Subscription;

  year = new Date().getFullYear().toString();

  // Available years: from 2023 up to next year
  years = Array.from({ length: new Date().getFullYear() - 2021 }, (_, i) => String(2023 + i));

  ngOnInit(): void {
    this.sub = this.globalState.selectedYear$.subscribe(year => {
      this.year = year.toString();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onYearChange(year: string): void {
    this.globalState.setYear(parseInt(year, 10));
  }
}
