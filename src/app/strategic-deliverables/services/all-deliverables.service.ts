import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StrategicDeliverable, deliverableFromApi } from './strategic-deliverables.service';
import { DeliverablesConfig, PRESIDENTIAL_CONFIG, MINISTERIAL_CONFIG, AGENCY_CONFIG } from '../deliverables-config';
import { ReferenceDataService, Department } from '../../core/services/reference-data.service';
import { unwrapList } from '../../core/api';

/** The three deliverables pages, presidential first (so "Both" deliverables open there). */
export const DELIVERABLE_SOURCES: DeliverablesConfig[] = [PRESIDENTIAL_CONFIG, MINISTERIAL_CONFIG, AGENCY_CONFIG];

/** Type filter options for dashboards and guest pages */
export const TYPE_OPTIONS = DELIVERABLE_SOURCES.map(s => ({ id: s.id, title: s.title }));

export interface SourceDeliverables {
  source: DeliverablesConfig;
  deliverables: StrategicDeliverable[];
  /** True when this page's list could not be loaded */
  failed: boolean;
}

/** The parts of a department the dashboards need */
export type DepartmentRef = Pick<Department, 'code' | 'name'>;

/**
 * Loads every page's deliverables at once, for cross-page views (dashboards, department and
 * guest pages). Results are kept in signals and loaded once; `refresh()` fetches again.
 */
@Injectable({ providedIn: 'root' })
export class AllDeliverablesService {
  private http = inject(HttpClient);
  private refData = inject(ReferenceDataService);

  /** Latest deliverables from each page */
  readonly results = signal<SourceDeliverables[]>([]);
  /** Departments from the shared cache; empty if they couldn't be loaded */
  readonly departments = this.refData.departments;
  readonly loading = signal(false);
  /** Whether at least one load has finished */
  readonly loaded = signal(false);

  /** One result per page; a page that fails to load comes back empty with failed = true. */
  loadAll(): Observable<SourceDeliverables[]> {
    return forkJoin(DELIVERABLE_SOURCES.map(source =>
      this.http.get<StrategicDeliverable[] | { data: StrategicDeliverable[] }>(`${environment.baseUrl}/${source.apiPath}`).pipe(
        map(res => ({ source, deliverables: unwrapList<StrategicDeliverable>(res).map(deliverableFromApi), failed: false })),
        catchError(() => of({ source, deliverables: [] as StrategicDeliverable[], failed: true }))
      )
    )).pipe(tap(results => this.results.set(results)));
  }

  /** One deliverable with its quarterly reports and notes (the lists leave the reports out). */
  loadOne(source: DeliverablesConfig, id: string): Observable<StrategicDeliverable> {
    return this.http.get<StrategicDeliverable>(`${environment.baseUrl}/${source.apiPath}/${id}`).pipe(map(deliverableFromApi));
  }

  /** Loads everything unless a load has already finished (pages that share the data call this). */
  ensureLoaded(): void {
    if (!this.loaded() && !this.loading()) this.refresh();
  }

  /** Fetches deliverables and departments again. */
  refresh(): void {
    this.loading.set(true);
    forkJoin([this.loadAll(), this.refData.ensureDepartments(true)]).subscribe({
      next: () => {
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.loaded.set(true);
      }
    });
  }
}
