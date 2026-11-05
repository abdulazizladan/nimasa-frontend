import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { unwrapList } from '../../core/api';
import { Department } from '../../core/services/reference-data.service';

export type { Department };

export interface Organization {
  code: string;
  name: string;
  motto?: string;
  logo?: string;
  isActive: boolean;
  departments?: Department[];
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  description?: string;
  head: string;
  directorEmail?: string;
  contactPhone?: string;
  organizationCode: string;
}

export interface CreateOrganizationPayload {
  code: string;
  name: string;
  motto?: string;
  logo?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly agenciesUrl = `${environment.baseUrl}/agencies`;
  private readonly deptsUrl = `${environment.baseUrl}/departments`;

  getAgencies(includeDepartments = true): Observable<Organization[]> {
    const params = new HttpParams().set('includeDepartments', String(includeDepartments));
    return this.http.get<Organization[] | { data: Organization[] }>(this.agenciesUrl, { params }).pipe(map(unwrapList<Organization>));
  }

  createAgency(payload: CreateOrganizationPayload): Observable<Organization> {
    return this.http.post<Organization>(this.agenciesUrl, payload);
  }

  updateAgency(code: string, payload: Partial<CreateOrganizationPayload>): Observable<Organization> {
    return this.http.patch<Organization>(`${this.agenciesUrl}/${code}`, payload);
  }

  createDepartment(payload: CreateDepartmentPayload): Observable<Department> {
    return this.http.post<Department>(this.deptsUrl, payload);
  }

  updateDepartment(id: string, payload: Partial<CreateDepartmentPayload>): Observable<Department> {
    return this.http.patch<Department>(`${this.deptsUrl}/${id}`, payload);
  }
}
