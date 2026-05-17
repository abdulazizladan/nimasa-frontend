import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import {
  MinisterialDeliverablesService,
  MinisterialDeliverable,
  Department
} from '../services/ministerial-deliverables.service';

export const MinisterialDeliverablesStore = signalStore(
  { providedIn: 'root' },
  withState({
    deliverables: [] as MinisterialDeliverable[],
    selectedDeliverable: null as MinisterialDeliverable | null,
    priorityAreas: [] as { id: string; name: string }[],
    departments: [] as Department[],
    loading: false,
    error: null as string | null,
    filterPriorityArea: '' as string,
    filterDepartment: '' as string,
    searchText: '' as string,
  }),
  withMethods((store, service = inject(MinisterialDeliverablesService)) => ({
    loadDeliverables: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          service.getAll().pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { deliverables: list, loading: false });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load ministerial deliverables.',
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
    loadPriorityAreas: rxMethod<void>(
      pipe(
        switchMap(() =>
          service.getPriorityAreas().pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { priorityAreas: list });
            }),
            catchError(() => of(null))
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
    createDeliverable: rxMethod<Partial<MinisterialDeliverable>>(
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
                error: err.error?.message || 'Failed to create ministerial deliverable.',
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
    updateDeliverable: rxMethod<{ id: string; dto: any }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, dto }) =>
          service.update(id, dto).pipe(
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
    setFilterPriorityArea(area: string) {
      patchState(store, { filterPriorityArea: area });
    },
    setFilterDepartment(department: string) {
      patchState(store, { filterDepartment: department });
    },
    setSearchText(text: string) {
      patchState(store, { searchText: text });
    },
    clearError() {
      patchState(store, { error: null });
    }
  }))
);
