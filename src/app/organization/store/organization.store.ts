import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import {
  OrganizationService,
  Organization,
  Department,
  CreateDepartmentPayload,
  CreateOrganizationPayload
} from '../services/organization.service';

export const OrganizationStore = signalStore(
  { providedIn: 'root' },
  withState({
    agencies: [] as Organization[],
    departments: [] as Department[],
    loading: false,
    error: null as string | null,
    activeTab: 'agencies' as 'agencies' | 'departments',
    searchQuery: '' as string,
  }),
  withMethods((store, service = inject(OrganizationService)) => ({
    loadAgencies: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          service.getAgencies(true).pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { agencies: list, loading: false });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load agencies.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    loadDepartments: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          service.getDepartments().pipe(
            tap((data: any) => {
              const list = Array.isArray(data) ? data : (data?.data ?? []);
              patchState(store, { departments: list, loading: false });
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to load departments.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    createAgency: rxMethod<{ payload: CreateOrganizationPayload; successCb?: () => void }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ payload, successCb }) =>
          service.createAgency(payload).pipe(
            tap((newAgency) => {
              const current = store.agencies();
              patchState(store, { agencies: [...current, newAgency], loading: false });
              if (successCb) successCb();
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to create agency.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    updateAgency: rxMethod<{ code: string; payload: Partial<CreateOrganizationPayload>; successCb?: () => void }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ code, payload, successCb }) =>
          service.updateAgency(code, payload).pipe(
            tap((updatedAgency) => {
              const updated = store.agencies().map((a) => (a.code === code ? updatedAgency : a));
              patchState(store, { agencies: updated, loading: false });
              if (successCb) successCb();
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to update agency.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    createDepartment: rxMethod<{ payload: CreateDepartmentPayload; successCb?: () => void }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ payload, successCb }) =>
          service.createDepartment(payload).pipe(
            tap((newDept) => {
              const current = store.departments();
              patchState(store, { departments: [...current, newDept], loading: false });
              if (successCb) successCb();
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to create department.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    updateDepartment: rxMethod<{ id: string; payload: Partial<CreateDepartmentPayload>; successCb?: () => void }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, payload, successCb }) =>
          service.updateDepartment(id, payload).pipe(
            tap((updatedDept) => {
              const updated = store.departments().map((d) => (d.id === id ? updatedDept : d));
              patchState(store, { departments: updated, loading: false });
              if (successCb) successCb();
            }),
            catchError((err) => {
              patchState(store, {
                error: err.error?.message || 'Failed to update department.',
                loading: false
              });
              return of(null);
            })
          )
        )
      )
    ),
    setActiveTab(tab: 'agencies' | 'departments') {
      patchState(store, { activeTab: tab });
    },
    setSearchQuery(query: string) {
      patchState(store, { searchQuery: query });
    },
    clearError() {
      patchState(store, { error: null });
    }
  }))
);
