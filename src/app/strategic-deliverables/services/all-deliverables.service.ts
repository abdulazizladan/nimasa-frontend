import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

/** Loads every page's deliverables at once, for cross-page views (dashboard, department pages). */
@Injectable({ providedIn: 'root' })
export class AllDeliverablesService {
  private http = inject(HttpClient);

  /** One result per page; a page that fails to load comes back empty with failed = true. */
  loadAll(): Observable<SourceDeliverables[]> {
    return forkJoin(DELIVERABLE_SOURCES.map(source =>
      this.http.get<StrategicDeliverable[]>(`${environment.baseUrl}/${source.apiPath}`).pipe(
        map(list => ({
          source,
          deliverables: Array.isArray(list) ? list : ((list as any)?.data ?? []),
          failed: false
        })),
        catchError(() => of({ source, deliverables: [] as StrategicDeliverable[], failed: true }))
      )
    ));
  }
}
