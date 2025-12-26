import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Deliverable } from '../models/deliverable.model';
import { DeliverableService } from '../services/deliverable';

@Component({
  selector: 'app-deliverable-details',
  standalone: false,
  templateUrl: './deliverable-details.html',
  styleUrl: './deliverable-details.scss'
})
export class DeliverableDetails implements OnInit {
  deliverable: Deliverable | null = null;
  isLoading = false;
  error: string | null = null;

  // Quarterly Chart
  quarterlyChartData: ChartData<'bar'> = {
    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
    datasets: [
      {
        label: 'Target',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      },
      {
        label: 'Actual',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      }
    ]
  };

  quarterlyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Quarterly Performance: Targets vs Actuals'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  quarterlyChartType: ChartType = 'bar';

  // Multi-year Chart
  multiYearChartData: ChartData<'line'> = {
    labels: ['2024 Actual', '2025 Target', '2026 Target', '2027 Target'],
    datasets: [
      {
        label: 'Targets Trend',
        data: [],
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  multiYearChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Multi-Year Targets Projection'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  multiYearChartType: ChartType = 'line';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliverableService: DeliverableService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDeliverable(id);
    }
  }

  loadDeliverable(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.deliverableService.getOne(id).subscribe({
      next: (deliverable) => {
        this.deliverable = deliverable;
        this.setupCharts(deliverable);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load deliverable details. Please try again.';
        this.isLoading = false;
        console.error('Error loading deliverable:', err);
      }
    });
  }

  setupCharts(deliverable: Deliverable): void {
    // Quarterly chart data
    this.quarterlyChartData.datasets[0].data = [
      deliverable.q1_2024_target || 0,
      deliverable.q2_2024_target || 0,
      deliverable.q3_2024_target || 0,
      deliverable.q4_2024_target || 0
    ];

    this.quarterlyChartData.datasets[1].data = [
      deliverable.q1_2024_actual || 0,
      deliverable.q2_2024_actual || 0,
      deliverable.q3_2024_actual || 0,
      deliverable.q4_2024_actual || 0
    ];

    // Multi-year chart data
    this.multiYearChartData.datasets[0].data = [
      deliverable.annual_2024_actual || 0,
      deliverable.target_2025 || 0,
      deliverable.target_2026 || 0,
      deliverable.target_2027 || 0
    ];
  }

  calculateProgress(): number {
    if (!this.deliverable || !this.deliverable.annual_2024_target) {
      return 0;
    }
    const progress = ((this.deliverable.annual_2024_actual || 0) / this.deliverable.annual_2024_target) * 100;
    return Math.min(Math.round(progress), 100);
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  editDeliverable(): void {
    if (this.deliverable) {
      this.router.navigate(['../', this.deliverable.id, 'edit'], { relativeTo: this.route });
    }
  }

  deleteDeliverable(): void {
    if (!this.deliverable) return;

    if (confirm('Are you sure you want to delete this deliverable?')) {
      this.deliverableService.delete(this.deliverable.id).subscribe({
        next: () => {
          this.router.navigate(['../'], { relativeTo: this.route });
        },
        error: (err) => {
          console.error('Error deleting deliverable:', err);
          alert('Failed to delete deliverable. Please try again.');
        }
      });
    }
  }
}
