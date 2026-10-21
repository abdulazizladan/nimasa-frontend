import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, concatMap, catchError, of, Observable } from 'rxjs';
import {
  StrategicDeliverablesService,
  StrategicDeliverable,
  PriorityArea,
  Department,
  QueryPrioritiesParams,
  QuarterlyReport
} from '../services/strategic-deliverables.service';

/** Optional callback run once a save/delete has succeeded (e.g. to close a modal). */
type WithCallback<T> = T & { onSuccess?: () => void };

const toList = (data: any) => (Array.isArray(data) ? data : (data?.data ?? []));

/** State for one deliverables page; provided per route alongside StrategicDeliverablesService. */
export const StrategicDeliverablesStore = signalStore(
  withState({
    priorities: [] as StrategicDeliverable[],
    selectedPriority: null as StrategicDeliverable | null,
    priorityAreas: [] as PriorityArea[],
    departments: [] as Department[],
    /** True while the priorities list is being fetched */
    loading: false,
    loadingMeta: false,
    /** True while a create/update/delete is in flight; does not hide the list */
    saving: false,
    error: null as string | null,
    filterPriorityArea: '' as string,
    filterDepartment: '' as string,
  }),
  withMethods((store, service = inject(StrategicDeliverablesService)) => {
    /** Runs a write request, tracking `saving`/`error` and invoking onSuccess when it completes. */
    const save = <T>(
      request: Observable<T>,
      errorMessage: string,
      onSuccess: ((result: T) => void) | undefined,
      callback?: () => void
    ) => {
      patchState(store, { saving: true, error: null });
      return request.pipe(
        tap((result) => {
          onSuccess?.(result);
          patchState(store, { saving: false });
          callback?.();
        }),
        catchError((err) => {
          const message = err.error?.message;
          patchState(store, {
            error: (Array.isArray(message) ? message.join(', ') : message) || errorMessage,
            saving: false
          });
          return of(null);
        })
      );
    };

    /** Reloads the priorities list after a quarterly report change (the backend updates yearlyPerformance). */
    const reloadPriorities = () =>
      service.getAll().pipe(tap((data: any) => patchState(store, { priorities: toList(data) })));

    return {
      loadPriorities: rxMethod<QueryPrioritiesParams | void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((query) =>
            service.getAll(query || undefined).pipe(
              tap((data: any) => patchState(store, { priorities: toList(data), loading: false })),
              catchError((err) => {
                patchState(store, {
                  error: err.error?.message || 'Failed to load deliverables.',
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
          tap(() => patchState(store, { loadingMeta: true })),
          switchMap(() =>
            service.getPriorityAreas().pipe(
              tap((data: any) => patchState(store, { priorityAreas: toList(data), loadingMeta: false })),
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
              tap((data: any) => patchState(store, { departments: toList(data) })),
              catchError(() => of(null))
            )
          )
        )
      ),
      createPriority: rxMethod<WithCallback<{ priority: Partial<StrategicDeliverable> }>>(
        pipe(
          concatMap(({ priority, onSuccess }) =>
            save(service.create(priority), 'Failed to create deliverable.', (created) =>
              patchState(store, { priorities: [...store.priorities(), created] }), onSuccess)
          )
        )
      ),
      updatePriority: rxMethod<WithCallback<{ id: string; priority: Partial<StrategicDeliverable> }>>(
        pipe(
          concatMap(({ id, priority, onSuccess }) =>
            save(service.update(id, priority), 'Failed to update deliverable.', (updated) =>
              patchState(store, { priorities: store.priorities().map(p => (p.id === id ? updated : p)) }), onSuccess)
          )
        )
      ),
      deletePriority: rxMethod<WithCallback<{ id: string }>>(
        pipe(
          concatMap(({ id, onSuccess }) =>
            save(service.delete(id), 'Failed to delete deliverable.', () =>
              patchState(store, { priorities: store.priorities().filter(p => p.id !== id) }), onSuccess)
          )
        )
      ),
      createPriorityArea: rxMethod<WithCallback<{ name: string }>>(
        pipe(
          concatMap(({ name, onSuccess }) =>
            save(service.createPriorityArea(name), 'Failed to create priority area.', (area) =>
              patchState(store, { priorityAreas: [...store.priorityAreas(), area] }), onSuccess)
          )
        )
      ),
      updatePriorityArea: rxMethod<WithCallback<{ id: string; name: string }>>(
        pipe(
          concatMap(({ id, name, onSuccess }) =>
            save(service.updatePriorityArea(id, name), 'Failed to update priority area.', (updated) =>
              patchState(store, { priorityAreas: store.priorityAreas().map(a => (a.id === id ? updated : a)) }), onSuccess)
          )
        )
      ),
      deletePriorityArea: rxMethod<WithCallback<{ id: string }>>(
        pipe(
          concatMap(({ id, onSuccess }) =>
            save(service.deletePriorityArea(id), 'Failed to delete priority area.', () =>
              patchState(store, { priorityAreas: store.priorityAreas().filter(a => a.id !== id) }), onSuccess)
          )
        )
      ),
      createSubmission: rxMethod<WithCallback<{ id: string; submission: Partial<QuarterlyReport> }>>(
        pipe(
          concatMap(({ id, submission, onSuccess }) =>
            save(service.createSubmission(id, submission).pipe(switchMap(reloadPriorities)),
              'Failed to submit quarterly report.', undefined, onSuccess)
          )
        )
      ),
      updateSubmission: rxMethod<WithCallback<{ reportId: string; submission: Partial<QuarterlyReport> }>>(
        pipe(
          concatMap(({ reportId, submission, onSuccess }) =>
            save(service.updateSubmission(reportId, submission).pipe(switchMap(reloadPriorities)),
              'Failed to update quarterly report.', undefined, onSuccess)
          )
        )
      ),
      deleteSubmission: rxMethod<WithCallback<{ reportId: string }>>(
        pipe(
          concatMap(({ reportId, onSuccess }) =>
            save(service.deleteSubmission(reportId).pipe(switchMap(reloadPriorities)),
              'Failed to delete quarterly report.', undefined, onSuccess)
          )
        )
      ),
      setFilterPriorityArea(area: string) {
        patchState(store, { filterPriorityArea: area });
      },
      setFilterDepartment(department: string) {
        patchState(store, { filterDepartment: department });
      },
      setError(error: string | null) {
        patchState(store, { error });
      },
      clearError() {
        patchState(store, { error: null });
      }
    };
  })
);
