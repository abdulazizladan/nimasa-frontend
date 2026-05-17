import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState({
    stats: {
      users: 0,
      presidentialPriorities: 0,
      ministerialDeliverables: 0,
      agencyKPIs: 0
    },
    loading: false,
    error: null as string | null
  }),
  withMethods((store, http = inject(HttpClient)) => ({
    loadStats: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => http.get<any>(`${environment.baseUrl}/dashboard/performance-report`).pipe(
          tap((res) => {
            if (res && res.summary_metrics) {
              const metrics = res.summary_metrics;
              patchState(store, {
                stats: {
                  users: metrics.totalUsers?.total || 0,
                  presidentialPriorities: metrics.totalPresidentialPriorities || 0,
                  ministerialDeliverables: metrics.totalMinisterialDeliverables || 0,
                  agencyKPIs: metrics.totalAgencyKPIs || 0
                },
                loading: false
              });
            } else {
              patchState(store, { loading: false });
            }
          }),
          catchError((err) => {
            patchState(store, { error: 'Failed to load dashboard stats', loading: false });
            return of(null);
          })
        ))
      )
    )
  }))
);
