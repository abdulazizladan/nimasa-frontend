import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface PerformanceReport {
  summary_metrics?: {
    totalUsers?: { admin?: number; guest?: number; total?: number };
  };
}

/** The admin dashboard's user count (deliverable counts come from AllDeliverablesService). */
export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    users: 0,
    loading: false,
    error: null as string | null
  }),
  withMethods((store, http = inject(HttpClient)) => ({
    loadStats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => http.get<PerformanceReport>(`${environment.baseUrl}/dashboard/performance-report`).pipe(
          tap(res => patchState(store, { users: res?.summary_metrics?.totalUsers?.total ?? 0, loading: false })),
          catchError(() => {
            patchState(store, { error: "The user count couldn't be loaded.", loading: false });
            return of(null);
          })
        ))
      )
    )
  }))
);
