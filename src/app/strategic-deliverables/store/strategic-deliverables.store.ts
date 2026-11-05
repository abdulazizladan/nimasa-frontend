import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, concatMap, catchError, of, Observable } from 'rxjs';
import {
  StrategicDeliverablesService, StrategicDeliverable, PriorityArea, QuarterlyReportInput
} from '../services/strategic-deliverables.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { apiErrorMessage } from '../../core/api';

/** Optional callback run once a save/delete has succeeded (e.g. to close a modal). */
type WithCallback<T> = T & { onSuccess?: () => void };

/**
 * State for one deliverables page; provided per route alongside StrategicDeliverablesService.
 * The router keeps route providers alive across navigation, so the lists are loaded once and
 * kept until `reload()`.
 */
export const StrategicDeliverablesStore = signalStore(
  withState({
    deliverables: [] as StrategicDeliverable[],
    priorityAreas: [] as PriorityArea[],
    /** True while the deliverables list is being fetched */
    loading: false,
    loadingMeta: false,
    /** Whether the lists have been fetched at least once */
    loaded: false,
    /** True while a create/update/delete is in flight; does not hide the list */
    saving: false,
    error: null as string | null,
    filterPriorityArea: '' as string,
    filterDepartment: '' as string,
  }),
  withComputed((_, refData = inject(ReferenceDataService)) => ({
    /** Departments from the shared cache */
    departments: refData.departments,
  })),
  withMethods((store, service = inject(StrategicDeliverablesService), refData = inject(ReferenceDataService)) => {
    /** Runs a write request, tracking `saving`/`error` and invoking onSuccess when it completes. */
    const save = <T>(
      request: Observable<T>,
      errorMessage: string,
      apply: ((result: T) => void) | undefined,
      onSuccess?: () => void
    ) => {
      patchState(store, { saving: true, error: null });
      return request.pipe(
        tap(result => {
          apply?.(result);
          patchState(store, { saving: false });
          onSuccess?.();
        }),
        catchError(err => {
          patchState(store, { error: apiErrorMessage(err, errorMessage), saving: false });
          return of(null);
        })
      );
    };

    /** Refreshes one deliverable after a report change (the backend recomputes its yearlyPerformance). */
    const refreshOne = (id: string) =>
      service.getOne(id).pipe(tap(fresh => patchState(store, {
        deliverables: store.deliverables().map(d => (d.id === id ? fresh : d))
      })));

    const loadDeliverables = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          service.getAll().pipe(
            tap(list => patchState(store, { deliverables: list, loading: false, loaded: true })),
            catchError(err => {
              patchState(store, { error: apiErrorMessage(err, 'Failed to load deliverables.'), loading: false, loaded: true });
              return of(null);
            })
          )
        )
      )
    );

    const loadPriorityAreas = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loadingMeta: true })),
        switchMap(() =>
          service.getPriorityAreas().pipe(
            tap(list => patchState(store, { priorityAreas: list, loadingMeta: false })),
            catchError(err => {
              patchState(store, { loadingMeta: false, error: apiErrorMessage(err, "Priority areas couldn't be loaded.") });
              return of(null);
            })
          )
        )
      )
    );

    return {
      loadDeliverables,
      loadPriorityAreas,
      /** Loads the page's lists unless they are already in memory. */
      ensureLoaded() {
        if (!store.loaded() && !store.loading()) {
          loadDeliverables();
          loadPriorityAreas();
        }
        refData.ensureDepartments().subscribe();
      },
      /** Fetches everything again. */
      reload() {
        loadDeliverables();
        loadPriorityAreas();
        refData.ensureDepartments(true).subscribe();
      },
      createDeliverable: rxMethod<WithCallback<{ deliverable: Partial<StrategicDeliverable> }>>(
        pipe(
          concatMap(({ deliverable, onSuccess }) =>
            save(service.create(deliverable), 'Failed to create deliverable.', created =>
              patchState(store, { deliverables: [...store.deliverables(), created] }), onSuccess)
          )
        )
      ),
      updateDeliverable: rxMethod<WithCallback<{ id: string; deliverable: Partial<StrategicDeliverable> }>>(
        pipe(
          concatMap(({ id, deliverable, onSuccess }) =>
            save(service.update(id, deliverable), 'Failed to update deliverable.', updated =>
              patchState(store, { deliverables: store.deliverables().map(d => (d.id === id ? updated : d)) }), onSuccess)
          )
        )
      ),
      deleteDeliverable: rxMethod<WithCallback<{ id: string }>>(
        pipe(
          concatMap(({ id, onSuccess }) =>
            save(service.delete(id), 'Failed to delete deliverable.', () =>
              patchState(store, { deliverables: store.deliverables().filter(d => d.id !== id) }), onSuccess)
          )
        )
      ),
      createPriorityArea: rxMethod<WithCallback<{ name: string }>>(
        pipe(
          concatMap(({ name, onSuccess }) =>
            save(service.createPriorityArea(name), 'Failed to create priority area.', area =>
              patchState(store, { priorityAreas: [...store.priorityAreas(), area] }), onSuccess)
          )
        )
      ),
      updatePriorityArea: rxMethod<WithCallback<{ id: string; name: string }>>(
        pipe(
          concatMap(({ id, name, onSuccess }) =>
            save(service.updatePriorityArea(id, name), 'Failed to update priority area.', updated =>
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
      createReport: rxMethod<WithCallback<{ deliverableId: string; report: QuarterlyReportInput }>>(
        pipe(
          concatMap(({ deliverableId, report, onSuccess }) =>
            save(service.createReport(deliverableId, report).pipe(switchMap(() => refreshOne(deliverableId))),
              'Failed to submit quarterly report.', undefined, onSuccess)
          )
        )
      ),
      updateReport: rxMethod<WithCallback<{ deliverableId: string; reportId: string; report: Partial<QuarterlyReportInput> }>>(
        pipe(
          concatMap(({ deliverableId, reportId, report, onSuccess }) =>
            save(service.updateReport(reportId, report).pipe(switchMap(() => refreshOne(deliverableId))),
              'Failed to update quarterly report.', undefined, onSuccess)
          )
        )
      ),
      deleteReport: rxMethod<WithCallback<{ deliverableId: string; reportId: string }>>(
        pipe(
          concatMap(({ deliverableId, reportId, onSuccess }) =>
            save(service.deleteReport(reportId).pipe(switchMap(() => refreshOne(deliverableId))),
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
      clearError() {
        patchState(store, { error: null });
      }
    };
  })
);
