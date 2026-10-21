import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardStore } from '../../store/dashboard.store';
import { GlobalStateService } from '../../../../core/services/global-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  dashboardStore = inject(DashboardStore);
  globalState = inject(GlobalStateService);
  private router = inject(Router);
  private sub?: Subscription;

  globalYear = new Date().getFullYear().toString();

  // Available years: from 2023 up to next year
  years = Array.from({ length: new Date().getFullYear() - 2021 }, (_, i) => String(2023 + i));

  ngOnInit() {
    this.dashboardStore.loadStats();
    this.sub = this.globalState.selectedYear$.subscribe(year => {
      this.globalYear = year.toString();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  onGlobalYearChange(year: string) {
    this.globalState.setYear(parseInt(year, 10));
  }

  navigateTo(path: string) {
    this.router.navigate([`/admin/${path}`]);
  }
}
