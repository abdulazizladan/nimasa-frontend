import { Component, OnInit, inject } from '@angular/core';
import { DashboardStore } from '../../admin/store/dashboard.store';

interface QuarterMetric {
  label: string;
  target: number;
  actual: number;
}

interface YearData {
  [year: string]: QuarterMetric[];
}

@Component({
  selector: 'app-guest-dashboard',
  standalone: false,
  templateUrl: './guest-dashboard.html',
  styleUrl: './guest-dashboard.css',
})
export class GuestDashboard implements OnInit {
  dashboardStore = inject(DashboardStore);

  // Selected years
  selectedPresidentialYear = '2025';
  selectedMinisterialYear = '2025';
  selectedAgencyYear = '2025';

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
  }

  get presidentialQuarterly() {
    return this.presidentialData[this.selectedPresidentialYear];
  }

  get ministerialQuarterly() {
    return this.ministerialData[this.selectedMinisterialYear];
  }

  get agencyQuarterly() {
    return this.agencyData[this.selectedAgencyYear];
  }
}
