import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartConfiguration, ChartOptions } from 'chart.js';

interface Target {
    id: number;
    name: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    deadline: string;
    status: 'On Track' | 'At Risk' | 'Behind' | 'Achieved';
}

@Component({
    selector: 'app-department-performance',
    templateUrl: './department-performance.html',
    standalone: false,
    styleUrls: ['./department-performance.scss']
})
export class DepartmentPerformance implements OnInit {
    departmentCode: string | null = null;
    departmentName: string = 'Marine Safety and Rescue';
    protected readonly Math = Math;

    // Performance Scores (in percentages)
    performanceScores = {
        overall: 78,
        targetCompletion: 65,
        efficiency: 82,
        quality: 88,
        timeliness: 71
    };

    // Department Targets
    targets: Target[] = [
        {
            id: 1,
            name: 'Vessel Safety Inspections',
            description: 'Complete safety inspections for commercial vessels',
            targetValue: 500,
            currentValue: 425,
            unit: 'inspections',
            deadline: '2025-12-31',
            status: 'On Track'
        },
        {
            id: 2,
            name: 'Crew Certification Processing',
            description: 'Process and issue crew certifications',
            targetValue: 1000,
            currentValue: 650,
            unit: 'certifications',
            deadline: '2025-12-31',
            status: 'At Risk'
        },
        {
            id: 3,
            name: 'Emergency Response Drills',
            description: 'Conduct maritime emergency response training drills',
            targetValue: 24,
            currentValue: 18,
            unit: 'drills',
            deadline: '2025-12-31',
            status: 'On Track'
        },
        {
            id: 4,
            name: 'Port Security Audits',
            description: 'Complete comprehensive security audits of major ports',
            targetValue: 12,
            currentValue: 8,
            unit: 'audits',
            deadline: '2025-12-31',
            status: 'Behind'
        },
        {
            id: 5,
            name: 'Compliance Reports',
            description: 'Submit regulatory compliance reports',
            targetValue: 4,
            currentValue: 4,
            unit: 'reports',
            deadline: '2025-12-31',
            status: 'Achieved'
        }
    ];

    // Metrics for cards
    metrics = {
        ongoingTasks: { value: 12, prev: 8, change: 50, trend: 'up' },
        performanceRating: { value: 4.2, prev: 4.0, change: 5, trend: 'up' },
        outstandingTasks: { value: 3, prev: 5, change: -40, trend: 'down' }
    };

    // Line Chart Data - Overall Growth
    public lineChartData: ChartConfiguration<'line'>['data'] = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                data: [62, 65, 68, 71, 69, 73, 75, 78, 76, 79, 81, 78],
                label: 'Overall Performance Score (%)',
                fill: true,
                tension: 0.4,
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                pointBackgroundColor: '#1976d2',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    public lineChartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + context.parsed.y + '%';
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    }
                },
                title: {
                    display: true,
                    text: 'Performance Score (%)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Month'
                }
            }
        }
    };

    public lineChartLegend = true;

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        this.departmentCode = this.route.snapshot.paramMap.get('code');
        // In a real app, you would fetch department name based on code
    }

    goBack(): void {
        if (this.departmentCode) {
            this.router.navigate(['/admin/organization/department', this.departmentCode]);
        } else {
            this.router.navigate(['/admin/organization']);
        }
    }

    getTargetProgress(target: Target): number {
        return Math.round((target.currentValue / target.targetValue) * 100);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Achieved':
                return 'status-achieved';
            case 'On Track':
                return 'status-on-track';
            case 'At Risk':
                return 'status-at-risk';
            case 'Behind':
                return 'status-behind';
            default:
                return '';
        }
    }
}
