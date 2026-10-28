import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StrategicDeliverable } from './strategic-deliverables.service';
import {
  DeliverablesConfig, PRESIDENTIAL_CONFIG, MINISTERIAL_CONFIG, AGENCY_CONFIG
} from '../deliverables-config';

/** The three deliverables pages, presidential first (so "Both" deliverables open there). */
export const DELIVERABLE_SOURCES: DeliverablesConfig[] = [PRESIDENTIAL_CONFIG, MINISTERIAL_CONFIG, AGENCY_CONFIG];

export interface SourceDeliverables {
  source: DeliverablesConfig;
  deliverables: StrategicDeliverable[];
  /** True when this page's list could not be loaded */
  failed: boolean;
}

/** The parts of a department the dashboard needs */
export interface DepartmentRef {
  code: string;
  name: string;
}

const toList = <T>(data: unknown): T[] => (Array.isArray(data) ? data : ((data as any)?.data ?? []));

/**
 * Loads every page's deliverables at once, for cross-page views (dashboards, department pages).
 * The latest results are also kept in signals, so several parts of a page can share one load.
 */
@Injectable({ providedIn: 'root' })
export class AllDeliverablesService {
  private http = inject(HttpClient);

  /** Latest deliverables from each page */
  readonly results = signal<SourceDeliverables[]>([]);
  /** Latest departments list; empty if it couldn't be loaded */
  readonly departments = signal<DepartmentRef[]>([]);
  readonly loading = signal(false);
  /** Whether at least one load has finished */
  readonly loaded = signal(false);

  /** One result per page; a page that fails to load comes back empty with failed = true. */
  loadAll(): Observable<SourceDeliverables[]> {
    return forkJoin(DELIVERABLE_SOURCES.map(source =>
      this.http.get<StrategicDeliverable[]>(`${environment.baseUrl}/${source.apiPath}`).pipe(
        map(list => ({ source, deliverables: toList<StrategicDeliverable>(list), failed: false })),
        catchError(() => of({ source, deliverables: [] as StrategicDeliverable[], failed: true }))
      )
    )).pipe(tap(results => this.results.set(results)));
  }

  /** One deliverable with its quarterly reports and notes (the lists leave the reports out). */
  loadOne(source: DeliverablesConfig, id: string): Observable<StrategicDeliverable> {
    return this.http.get<StrategicDeliverable>(`${environment.baseUrl}/${source.apiPath}/${id}`);
  }

  /** Loads everything unless a load has already finished (pages that share the data call this). */
  ensureLoaded(): void {
    if (!this.loaded() && !this.loading()) this.refresh();
  }

  /** Reloads deliverables and departments into the signals. */
  refresh(): void {
    this.loading.set(true);
    const departments$ = this.http.get<DepartmentRef[]>(`${environment.baseUrl}/departments`).pipe(
      map(list => toList<DepartmentRef>(list).map(d => ({ code: d.code, name: d.name }))),
      catchError(() => of([] as DepartmentRef[]))
    );
    forkJoin([this.loadAll(), departments$]).subscribe(([, departments]) => {
      this.departments.set(departments);
      this.loading.set(false);
      this.loaded.set(true);
    });
  }
}
