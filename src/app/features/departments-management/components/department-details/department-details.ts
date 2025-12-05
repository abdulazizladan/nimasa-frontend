import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, finalize, map, switchMap, tap } from 'rxjs';
import { env } from '../../../../../environment/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface DepartmentPerformance {
  departmentId: string;
  year: number;
  month: number;
  performanceScore: number;
  totalTargets: number;
  completedTargets: number;
  pendingTargets: number;
  overdueTargets: number;
  notes: string;
}

@Component({
  selector: 'app-department-details',
  standalone: false,
  templateUrl: './department-details.html',
  styleUrl: './department-details.scss'
})
export class DepartmentDetails implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiBase = env.baseUrl.replace(/\/$/, '');

  protected readonly isLoading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly performance = signal<DepartmentPerformance | null>(null);
  protected readonly departmentId = signal<string | null>(null);

  protected readonly selectedYear = new Date().getFullYear();
  protected readonly selectedMonth = new Date().getMonth() + 1;

  protected readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  protected readonly completionRate = computed(() => {
    const current = this.performance();
    if (!current || current.totalTargets === 0) {
      return 0;
    }

    return Math.round((current.completedTargets / current.totalTargets) * 100);
  });

  protected readonly pendingRatio = computed(() => {
    const current = this.performance();
    if (!current || current.totalTargets === 0) {
      return 0;
    }

    return Math.round((current.pendingTargets / current.totalTargets) * 100);
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('code')),
        tap(code => {
          this.loadError.set(null);
          this.departmentId.set(code);
        }),
        switchMap(code => {
          if (!code) {
            this.loadError.set('Department identifier is missing in the route.');
            return EMPTY;
          }
          return this.fetchPerformance$(code);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchPerformance$(departmentId: string) {
    this.isLoading.set(true);
    const url = this.buildPerformanceUrl(departmentId);

    return this.http.get<DepartmentPerformance>(url).pipe(
      tap(response => this.performance.set(response)),
      finalize(() => this.isLoading.set(false)),
      catchError(error => {
        console.error('Failed to load department performance', error);
        this.loadError.set('Unable to load performance data at the moment.');
        this.performance.set(null);
        return EMPTY;
      })
    );
  }

  private buildPerformanceUrl(departmentId: string): string {
    const searchParams = new URLSearchParams({
      year: this.selectedYear.toString(),
      month: this.selectedMonth.toString()
    });

    return `${this.apiBase}/departments/${departmentId}/performance?${searchParams.toString()}`;
  }

}
