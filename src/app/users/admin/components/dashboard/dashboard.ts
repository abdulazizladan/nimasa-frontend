import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit{
// Bar Chart - Target vs Actual
public barChartData: ChartConfiguration<'bar'>['data'] = {
  labels: ['Seafarers Placed', 'ISPS Compliance', 'Online Transactions', 'Policy Development'],
  datasets: [
    {
      label: '2024 Target',
      data: [5415, 85, 4500, 100],
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    },
    {
      label: '2024 Actual',
      data: [3857, 85, 3200, 45],
      backgroundColor: 'rgba(54, 162, 235, 1)'
    },
    {
      label: '2025 Target',
      data: [5415, 90, 5000, 100],
      backgroundColor: 'rgba(255, 99, 132, 0.6)'
    },
    {
      label: 'Q2 2025 Actual',
      data: [3446, 88, 0, 0],
      backgroundColor: 'rgba(255, 99, 132, 1)'
    }
  ]
};

public barChartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Target vs Actual Comparison'
    }
  }
};

// Line Chart - Quarterly Progress
public lineChartData: ChartConfiguration<'line'>['data'] = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    {
      label: 'Seafarers Placed - Actual',
      data: [1200, 3446, null, null],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true
    },
    {
      label: 'Seafarers Placed - Target',
      data: [1354, 1354, 1354, 1354],
      borderColor: 'rgba(255, 99, 132, 1)',
      borderDash: [5, 5],
      fill: false
    }
  ]
};

public lineChartOptions: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    }
  }
};

// Doughnut Chart - Performance by Priority Area
public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
  labels: ['Infrastructure', 'Governance', 'Service Delivery'],
  datasets: [{
    data: [65, 25, 10],
    backgroundColor: [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 206, 86, 0.8)'
    ]
  }]
};

public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    }
  }
};

// Horizontal Bar Chart - Outstanding Targets
public horizontalBarChartData: ChartConfiguration<'bar'>['data'] = {
  labels: ['Online Transactions', 'Seafarers Placement', 'Policy Development'],
  datasets: [{
    label: 'Outstanding Target',
    data: [-5000, -1940, -100],
    backgroundColor: [
      'rgba(255, 99, 132, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(255, 205, 86, 0.8)'
    ]
  }]
};

public horizontalBarChartOptions: ChartConfiguration<'bar'>['options'] = {
  indexAxis: 'y',
  responsive: true,
  plugins: {
    legend: {
      display: false
    }
  }
};

// Data Table
displayedColumns: string[] = ['priorityArea', 'deliverable', 'target2025', 'actualQ22025', 'outstanding'];
dataSource = [
  {
    priorityArea: 'Enhance Infrastructure',
    deliverable: 'Develop and Implement National Policy',
    target2025: 100,
    actualQ22025: 0,
    outstanding: -100
  },
  {
    priorityArea: 'Enhance Infrastructure',
    deliverable: 'Number of Nigerian Seafarers placed',
    target2025: 5415,
    actualQ22025: 3446,
    outstanding: -1940
  },
  {
    priorityArea: 'Improve Governance',
    deliverable: 'Number of transactions conducted online',
    target2025: 5000,
    actualQ22025: 0,
    outstanding: -5000
  }
];

constructor() { }

ngOnInit(): void { }
}

