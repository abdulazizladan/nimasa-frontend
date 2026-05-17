import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import { AgencyDeliverablesService, AgencyDeliverable, DeliverablesSummary, Department, QueryDeliverablesParams } from '../services/agency-deliverables.service';

export const AgencyDeliverablesStore = signalStore(
  { providedIn: 'root' },
  withState({
    deliverables: [] as AgencyDeliverable[],
    selectedDeliverable: null as AgencyDeliverable | null,
    summary: null as DeliverablesSummary | null,
    departments: [] as Department[],
    loading: false,
    loadingDepts: false,
    error: null as string | null,
    /** Filters against the deliverable's `ministry` field (which is an agency name in NIMASA) */
    filterAgency: '' as string,
    filterDepartment: '' as string,
  }),
  withMethods((store, service = inject(AgencyDeliverablesService)) => ({
    loadDeliverables: rxMethod<QueryDeliverablesParams | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((query) =>
          service.getAll(query || undefined).pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { deliverables: list, loading: false });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load agency deliverables.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    loadSummary: rxMethod<void>(
      pipe(
        switchMap(() =>
          service.getSummary().pipe(
            tap((summary) => patchState(store, { summary })),
            catchError(() => of(null))
          )
        )
      )
    ),
    loadDepartments: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loadingDepts: true })),
        switchMap(() =>
          service.getDepartments().pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { departments: list, loadingDepts: false });
            }),
            catchError(() => {
              patchState(store, { loadingDepts: false });
              return of(null);
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null, selectedDeliverable: null })),
        switchMap((id) =>
          service.getOne(id).pipe(
            tap((d) => patchState(store, { selectedDeliverable: d, loading: false })),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load deliverable.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    createDeliverable: rxMethod<Partial<AgencyDeliverable>>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          service.create(dto).pipe(
            tap((newDeliverable) => {
              patchState(store, {
                deliverables: [newDeliverable, ...store.deliverables()],
                loading: false
              });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to create agency deliverable.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    createSubmission: rxMethod<{ id: string; submission: any }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, submission }) =>
          service.createSubmission(id, submission).pipe(
            tap(() => {
              service.getAll().subscribe((data: any) => {
                const list = Array.isArray(data) ? data : (data?.data ?? []);
                patchState(store, { deliverables: list, loading: false });
              });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to submit quarterly report.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    setFilterAgency(agency: string) {
      patchState(store, { filterAgency: agency });
    },
    setFilterDepartment(department: string) {
      patchState(store, { filterDepartment: department });
    },
    clearError() {
      patchState(store, { error: null });
    }
  }))
);
