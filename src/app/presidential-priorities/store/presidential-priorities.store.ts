import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import {
  PresidentialPrioritiesService,
  PresidentialPriority,
  PriorityArea,
  Department,
  QueryPrioritiesParams
} from '../services/presidential-priorities.service';

export const PresidentialPrioritiesStore = signalStore(
  { providedIn: 'root' },
  withState({
    priorities: [] as PresidentialPriority[],
    selectedPriority: null as PresidentialPriority | null,
    priorityAreas: [] as PriorityArea[],
    departments: [] as Department[],
    loading: false,
    loadingMeta: false,
    error: null as string | null,
    filterMinistry: '' as string,
    filterPriorityArea: '' as string,
    filterDepartment: '' as string,
  }),
  withMethods((store, service = inject(PresidentialPrioritiesService)) => ({
    loadPriorities: rxMethod<QueryPrioritiesParams | void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((query) =>
          service.getAll(query || undefined).pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { priorities: list, loading: false });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load presidential priorities.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null, selectedPriority: null })),
        switchMap((id) =>
          service.getOne(id).pipe(
            tap((d) => patchState(store, { selectedPriority: d, loading: false })),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load priority.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    loadPriorityAreas: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loadingMeta: true })),
        switchMap(() =>
          service.getPriorityAreas().pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { priorityAreas: list, loadingMeta: false });
            }),
            catchError(() => {
              patchState(store, { loadingMeta: false });
              return of(null);
            })
          )
        )
      )
    ),
    loadDepartments: rxMethod<void>(
      pipe(
        switchMap(() =>
          service.getDepartments().pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { departments: list });
            }),
            catchError(() => of(null))
          )
        )
      )
    ),
    createPriority: rxMethod<Partial<PresidentialPriority>>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          service.create(dto).pipe(
            tap((newPriority) => {
              patchState(store, {
                priorities: [newPriority, ...store.priorities()],
                loading: false
              });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to create presidential priority.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    updatePriority: rxMethod<{ id: string; priority: Partial<PresidentialPriority> }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, priority }) =>
          service.update(id, priority).pipe(
            tap((updatedPriority) => {
              const updatedList = store.priorities().map(p => 
                p.id === id ? updatedPriority : p
              );
              patchState(store, {
                priorities: updatedList,
                loading: false
              });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to update priority.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    deletePriority: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          service.delete(id).pipe(
            tap(() => {
              const updatedList = store.priorities().filter(p => p.id !== id);
              patchState(store, {
                priorities: updatedList,
                loading: false
              });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to delete priority.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    createPriorityArea: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((name) =>
          service.createPriorityArea(name).pipe(
            tap((newArea) => {
              patchState(store, {
                priorityAreas: [...store.priorityAreas(), newArea],
                loading: false
              });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to create priority area.',
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
                patchState(store, { priorities: list, loading: false });
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
    setFilterMinistry(ministry: string) {
      patchState(store, { filterMinistry: ministry });
    },
    setFilterPriorityArea(area: string) {
      patchState(store, { filterPriorityArea: area });
    },
    setFilterDepartment(department: string) {
      patchState(store, { filterDepartment: department });
    },
    clearError() {
      patchState(store, { error: null });
    }
  }))
);
