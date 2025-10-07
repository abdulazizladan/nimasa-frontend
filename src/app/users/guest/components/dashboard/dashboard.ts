import { ChangeDetectionStrategy, Component, computed, signal, OnInit } from '@angular/core';

// Mock types for ng2-charts to show expected data structure
interface ChartData {
  labels: string[];
  datasets: { data: number[], label: string, backgroundColor?: string | string[], borderColor?: string, type?: string }[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales?: any;
}

// --- MOCK DATA SOURCE ---
// Represents the data pulled from your PostgreSQL database via the NestJS backend
const PERFORMANCE_DATA = [
  {
    priorityArea: 'Enhance Infrastructure and Transportation',
    deliverable: 'Develop and Implement National Policy...',
    target2024: 100, actual2024: 95,
    target2025: 100, actualQ22025: 0,
    q1Actual: 0, q2Actual: 0, q3Actual: 0, q4Actual: 0,
  },
  {
    priorityArea: 'Enhance Infrastructure and Transportation',
    deliverable: 'Number of Port Facilities that are ISPS Code Compliant',
    target2024: 85, actual2024: 85,
    target2025: 90, actualQ22025: 45,
    q1Actual: 25, q2Actual: 20, q3Actual: 0, q4Actual: 0,
  },
  {
    priorityArea: 'Enhance Infrastructure and Transportation',
    deliverable: 'Number of Nigerian Seafarers placed onboard vessels',
    target2024: 5415, actual2024: 3857,
    target2025: 5415, actualQ22025: 3475,
    q1Actual: 1500, q2Actual: 1975, q3Actual: 0, q4Actual: 0,
  },
  {
    priorityArea: 'Improve Governance for Effective Service Delivery',
    deliverable: 'Number of transactions conducted online.',
    target2024: 5000, actual2024: 4900,
    target2025: 7000, actualQ22025: 0,
    q1Actual: 0, q2Actual: 0, q3Actual: 0, q4Actual: 0,
  },
];

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit{

  // --- Signals for state management ---
  private rawData = signal(PERFORMANCE_DATA);
  selectedPriorityArea = signal('All');
  selectedYear = signal('2025');

  // --- Filtered Data ---
  filteredData = computed(() => {
    return this.rawData().filter(item => {
      const isAreaMatch = this.selectedPriorityArea() === 'All' || item.priorityArea === this.selectedPriorityArea();

      let target: number;
      let actual: number;

      if (this.selectedYear() === '2025') {
        target = item.target2025;
        actual = item.actualQ22025;
      } else {
        target = item.target2024;
        actual = item.actual2024;
      }

      // Calculate outstanding gap based on selected year
      const outstanding = actual - target;

      return isAreaMatch ? { ...item, outstanding } : false;
    }).filter(Boolean) as (typeof PERFORMANCE_DATA[0] & { outstanding: number })[];
  });

  // --- KPI Calculations (Computed Signals) ---
  kpis = computed(() => {
    const data = this.rawData();
    const totalActual2024 = data.reduce((sum, item) => sum + item.actual2024, 0);
    const totalTarget2024 = data.reduce((sum, item) => sum + item.target2024, 0);
    const totalActualQ22025 = data.reduce((sum, item) => sum + item.actualQ22025, 0);
    const totalTarget2025 = data.reduce((sum, item) => sum + item.target2025, 0);

    const goalAttainment2024 = (totalActual2024 / totalTarget2024) * 100;
    const currentProgress2025 = (totalActualQ22025 / totalTarget2025) * 100;

    // Top Performing (Highest Actual/Target ratio in 2024)
    const topPerformer = data.map(item => ({
      deliverable: item.deliverable,
      ratio: item.actual2024 / item.target2024,
    })).reduce((max, item) => (item.ratio > max.ratio ? item : max), { ratio: 0, deliverable: '' });

    // Most Outstanding (Lowest value in (Actual - Target) for 2025)
    const mostOutstanding = data.map(item => ({
      deliverable: item.deliverable,
      outstanding: item.actualQ22025 - item.target2025,
    })).reduce((min, item) => (item.outstanding < min.outstanding ? item : min), { outstanding: 0, deliverable: '' });

    return [
      {
        title: 'Overall Goal Attainment (2024)',
        value: `${goalAttainment2024.toFixed(1)}%`,
        insight: 'High-level success rate for the previous year.',
        color: 'green'
      },
      {
        title: 'Current Progress (2025 Q2)',
        value: `${currentProgress2025.toFixed(1)}%`,
        insight: 'Current standing relative to this year\'s full goal.',
        color: 'blue'
      },
      {
        title: 'Top Performing Deliverable (2024)',
        value: topPerformer.deliverable.split(' ').slice(0, 4).join(' ') + '...',
        insight: `${(topPerformer.ratio * 100).toFixed(0)}% Achieved (ISPS Compliant)`,
        color: 'indigo'
      },
      {
        title: 'Most Outstanding Target (2025 Gap)',
        value: `${mostOutstanding.outstanding.toLocaleString()}`,
        insight: 'Focuses attention on critical areas needing intervention.',
        color: 'red'
      }
    ];
  });

  priorityAreas = computed(() => {
    const areas = new Set(this.rawData().map(d => d.priorityArea));
    return Array.from(areas);
  });

  // Helper to calculate performance ratio for Chart C
  private priorityAreaPerformance = computed(() => {
    const data = this.rawData();
    const areas: { [key: string]: { actual: number, target: number } } = {};
    for (const item of data) {
      if (!areas[item.priorityArea]) {
        areas[item.priorityArea] = { actual: 0, target: 0 };
      }
      areas[item.priorityArea].actual += item.actual2024;
      areas[item.priorityArea].target += item.target2024;
    }

    const performance: { [key: string]: number } = {};
    for (const area in areas) {
      performance[area] = (areas[area].actual / areas[area].target) * 100;
    }
    return performance;
  });

  // --- ng2-charts Mock Data Structures ---
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  outstandingChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false }
      }
    }
  };


  // A. Target vs. Actual (2024 & 2025) - Grouped Bar Chart
  targetActualChartData = computed<ChartData>(() => {
    const labels = this.rawData().map(d => d.deliverable.split(' ').slice(0, 4).join(' ') + '...');
    const data = this.rawData();

    return {
      labels: labels,
      datasets: [
        { data: data.map(d => d.actual2024), label: '2024 Actual', backgroundColor: '#3b82f6', borderColor: '#2563eb' },
        { data: data.map(d => d.target2024), label: '2024 Target', backgroundColor: '#93c5fd', borderColor: '#60a5fa' },
        { data: data.map(d => d.actualQ22025), label: 'Q2 2025 Actual', backgroundColor: '#10b981', borderColor: '#059669' },
        { data: data.map(d => d.target2025), label: '2025 Target', backgroundColor: '#6ee7b7', borderColor: '#34d399' },
      ],
    };
  });

  // B. Quarterly Progress & Trend (2025) - Line Chart
  quarterlyProgressChartData = computed<ChartData>(() => {
    const seafarerData = this.rawData().find(d => d.deliverable.includes('Seafarers'))!;
    return {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          data: [seafarerData.q1Actual, seafarerData.q2Actual, seafarerData.target2025 / 4, seafarerData.target2025 / 4], // Q3/Q4 using target average
          label: '2025 Actual Progress',
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          type: 'line'
        },
      ],
    };
  });

  // C. Performance by Priority Area - Bar Chart
  priorityAreaChartData = computed<ChartData>(() => {
    const performance = this.priorityAreaPerformance();
    const labels = Object.keys(performance);
    const data = Object.values(performance);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          label: '2024 Achievement Ratio (%)',
          backgroundColor: labels.map(label => label.includes('Infrastructure') ? '#8b5cf6' : '#ec4899'),
        },
      ],
    };
  });

  // D. Outstanding Target Analysis (Focus Area) - Simple Bar Chart
  outstandingTargetChartData = computed<ChartData>(() => {
    const outstandingData = this.filteredData()
      .filter(item => item.outstanding < 0)
      .sort((a, b) => a.outstanding - b.outstanding); // Most negative first

    return {
      labels: outstandingData.map(d => d.deliverable.split(' ').slice(0, 4).join(' ') + '...'),
      datasets: [
        {
          data: outstandingData.map(d => d.outstanding),
          label: 'Outstanding Gap (2025)',
          backgroundColor: outstandingData.map(d => d.outstanding < -1000 ? '#ef4444' : '#f97316'), // Red for critical, orange for significant
        },
      ],
    };
  });
  
  // --- Methods ---
  ngOnInit() {
    // Initial calculation or data load simulation
    this.filterData(); 
  }

  filterData() {
    // This method triggers computed signals to re-run
    this.selectedPriorityArea.set(this.selectedPriorityArea());
    this.selectedYear.set(this.selectedYear());
    console.log(`Filtering data for Area: ${this.selectedPriorityArea()} and Year: ${this.selectedYear()}`);
  }

}
