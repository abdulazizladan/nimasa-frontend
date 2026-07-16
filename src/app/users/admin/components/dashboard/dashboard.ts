import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardStore } from '../../store/dashboard.store';
import { GlobalStateService } from '../../../../core/services/global-state.service';
import { Subscription } from 'rxjs';

interface QuarterMetric {
  label: string;
  target: number;
  actual: number;
}

interface YearData {
  [year: string]: QuarterMetric[];
}

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

  globalYear = '2025';

  // Available years
  years = ['2024', '2025', '2026'];

  // Mock Performance Data
  presidentialData: YearData = {
    '2024': [
      { label: 'Q1', target: 70, actual: 65 },
      { label: 'Q2', target: 75, actual: 72 },
      { label: 'Q3', target: 80, actual: 82 },
      { label: 'Q4', target: 85, actual: 84 },
    ],
    '2025': [
      { label: 'Q1', target: 80, actual: 78 },
      { label: 'Q2', target: 85, actual: 88 },
      { label: 'Q3', target: 90, actual: 87 },
      { label: 'Q4', target: 95, actual: 92 },
    ],
    '2026': [
      { label: 'Q1', target: 85, actual: 80 },
      { label: 'Q2', target: 90, actual: 92 },
      { label: 'Q3', target: 92, actual: 89 },
      { label: 'Q4', target: 95, actual: 96 },
    ]
  };

  ministerialData: YearData = {
    '2024': [
      { label: 'Q1', target: 65, actual: 60 },
      { label: 'Q2', target: 70, actual: 68 },
      { label: 'Q3', target: 75, actual: 74 },
      { label: 'Q4', target: 80, actual: 82 },
    ],
    '2025': [
      { label: 'Q1', target: 75, actual: 72 },
      { label: 'Q2', target: 80, actual: 84 },
      { label: 'Q3', target: 85, actual: 82 },
      { label: 'Q4', target: 90, actual: 91 },
    ],
    '2026': [
      { label: 'Q1', target: 80, actual: 78 },
      { label: 'Q2', target: 85, actual: 89 },
      { label: 'Q3', target: 90, actual: 92 },
      { label: 'Q4', target: 95, actual: 94 },
    ]
  };

  agencyData: YearData = {
    '2024': [
      { label: 'Q1', target: 60, actual: 55 },
      { label: 'Q2', target: 65, actual: 68 },
      { label: 'Q3', target: 70, actual: 72 },
      { label: 'Q4', target: 75, actual: 70 },
    ],
    '2025': [
      { label: 'Q1', target: 70, actual: 72 },
      { label: 'Q2', target: 75, actual: 78 },
      { label: 'Q3', target: 80, actual: 83 },
      { label: 'Q4', target: 85, actual: 80 },
    ],
    '2026': [
      { label: 'Q1', target: 75, actual: 74 },
      { label: 'Q2', target: 80, actual: 82 },
      { label: 'Q3', target: 85, actual: 88 },
      { label: 'Q4', target: 90, actual: 91 },
    ]
  };

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

  get presidentialQuarterly() {
    return this.presidentialData[this.globalYear] || [];
  }

  get ministerialQuarterly() {
    return this.ministerialData[this.globalYear] || [];
  }

  get agencyQuarterly() {
    return this.agencyData[this.globalYear] || [];
  }
}
