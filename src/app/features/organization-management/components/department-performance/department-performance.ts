import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
    selector: 'app-department-performance',
    templateUrl: './department-performance.html',
    standalone: false,
    styleUrls: ['./department-performance.scss']
})
export class DepartmentPerformance implements OnInit {
    departmentCode: string | null = null;
    protected readonly Math = Math;

    // Dummy Data for cards
    metrics = {
        ongoingTasks: { value: 12, prev: 8, change: 50, trend: 'up' },
        performanceRating: { value: 4.2, prev: 4.0, change: 5, trend: 'up' },
        outstandingTasks: { value: 3, prev: 5, change: -40, trend: 'down' } // improved
    };

    // Line Chart Data
    public lineChartData: ChartConfiguration<'line'>['data'] = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                data: [65, 59, 80, 81, 56, 85],
                label: 'Overall Performance',
                fill: true,
                tension: 0.5,
                borderColor: 'black',
                backgroundColor: 'rgba(0,0,0,0.1)'
            }
        ]
    };
    public lineChartOptions: ChartOptions<'line'> = {
        responsive: true
    };
    public lineChartLegend = true;

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        this.departmentCode = this.route.snapshot.paramMap.get('code');
    }

    goBack(): void {
        if (this.departmentCode) {
            this.router.navigate(['/admin/organization/department', this.departmentCode]);
        } else {
            this.router.navigate(['/admin/organization']);
        }
    }
}
