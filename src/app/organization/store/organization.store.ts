import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, concatMap, catchError, of, Observable } from 'rxjs';
import {
  OrganizationService, Organization, Department, CreateDepartmentPayload, CreateOrganizationPayload
} from '../services/organization.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { apiErrorMessage } from '../../core/api';

type WithCallback<T> = T & { onSuccess?: () => void };

/**
 * Agencies and departments. Departments live in the shared ReferenceDataService cache, so the
 * deliverables forms see changes made here without reloading.
 */
export const OrganizationStore = signalStore(
  { providedIn: 'root' },
  withState({
    agencies: [] as Organization[],
    /** True while the lists are being fetched */
    loading: false,
    /** True while a create/update is in flight; the page stays visible */
    saving: false,
    error: null as string | null,
    searchQuery: '' as string,
  }),
  withComputed((_, refData = inject(ReferenceDataService)) => ({
    departments: refData.departments,
  })),
  withMethods((store, service = inject(OrganizationService), refData = inject(ReferenceDataService)) => {
    const save = <T>(request: Observable<T>, errorMessage: string, apply: (result: T) => void, onSuccess?: () => void) => {
      patchState(store, { saving: true, error: null });
      return request.pipe(
        tap(result => {
          apply(result);
          patchState(store, { saving: false });
          onSuccess?.();
        }),
        catchError(err => {
          patchState(store, { error: apiErrorMessage(err, errorMessage), saving: false });
          return of(null);
        })
      );
    };

    return {
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            service.getAgencies(true).pipe(
              tap(list => patchState(store, { agencies: list })),
              catchError(err => {
                patchState(store, { error: apiErrorMessage(err, 'Failed to load agencies.') });
                return of(null);
              }),
              switchMap(() => refData.ensureDepartments(true)),
              tap(() => patchState(store, { loading: false }))
            )
          )
        )
      ),
      createAgency: rxMethod<WithCallback<{ payload: CreateOrganizationPayload }>>(
        pipe(
          concatMap(({ payload, onSuccess }) =>
            save(service.createAgency(payload), 'Failed to create agency.', created =>
              patchState(store, { agencies: [...store.agencies(), created] }), onSuccess)
          )
        )
      ),
      updateAgency: rxMethod<WithCallback<{ code: string; payload: Partial<CreateOrganizationPayload> }>>(
        pipe(
          concatMap(({ code, payload, onSuccess }) =>
            save(service.updateAgency(code, payload), 'Failed to update agency.', updated =>
              patchState(store, { agencies: store.agencies().map(a => (a.code === code ? updated : a)) }), onSuccess)
          )
        )
      ),
      createDepartment: rxMethod<WithCallback<{ payload: CreateDepartmentPayload }>>(
        pipe(
          concatMap(({ payload, onSuccess }) =>
            save(service.createDepartment(payload), 'Failed to create department.', created =>
              refData.setDepartments([...refData.departments(), created]), onSuccess)
          )
        )
      ),
      updateDepartment: rxMethod<WithCallback<{ id: string; payload: Partial<CreateDepartmentPayload> }>>(
        pipe(
          concatMap(({ id, payload, onSuccess }) =>
            save(service.updateDepartment(id, payload), 'Failed to update department.', updated =>
              refData.setDepartments(refData.departments().map(d => (d.id === id ? updated : d))), onSuccess)
          )
        )
      ),
      setSearchQuery(query: string) {
        patchState(store, { searchQuery: query });
      },
      clearError() {
        patchState(store, { error: null });
      }
    };
  })
);
