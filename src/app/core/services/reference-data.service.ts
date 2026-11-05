import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { unwrapList } from '../api';

/** A department as the API returns it (organization/services/organization.service.ts re-exports this). */
export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  head: string;
  directorEmail?: string;
  contactPhone?: string;
  organization?: { code: string; name: string };
}

/**
 * One cache for the lists several pages need (today: departments). Pages call `ensureDepartments()`
 * and read the `departments` signal; the organization page updates it after a save, so the
 * deliverables forms see new departments without a reload.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private http = inject(HttpClient);
  private inflight?: Observable<Department[]>;

  readonly departments = signal<Department[]>([]);
  readonly departmentsLoaded = signal(false);
  /** Set when the last load failed; readers decide whether to show it */
  readonly departmentsError = signal<string | null>(null);

  /** Loads departments once; later calls return the cached list (unless `force`). */
  ensureDepartments(force = false): Observable<Department[]> {
    if (this.departmentsLoaded() && !force) return of(this.departments());
    if (this.inflight && !force) return this.inflight;
    this.inflight = this.http.get<Department[] | { data: Department[] }>(`${environment.baseUrl}/departments`).pipe(
      map(unwrapList<Department>),
      tap(list => {
        this.departments.set(list);
        this.departmentsLoaded.set(true);
        this.departmentsError.set(null);
      }),
      catchError(() => {
        this.departmentsError.set("Departments couldn't be loaded.");
        return of([] as Department[]);
      }),
      tap(() => (this.inflight = undefined)),
      shareReplay(1)
    );
    return this.inflight;
  }

  /** Replaces the cached list (after the organization page creates or edits departments). */
  setDepartments(list: Department[]): void {
    this.departments.set(list);
    this.departmentsLoaded.set(true);
  }
}
