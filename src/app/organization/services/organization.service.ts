import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Organization {
  code: string;
  name: string;
  motto?: string;
  logo?: string;
  isActive: boolean;
  departments?: Department[];
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  head: string;
  directorEmail?: string;
  contactPhone?: string;
  organization?: Organization;
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
  private readonly agenciesUrl = `${environment.baseUrl}/agencies`;
  private readonly deptsUrl = `${environment.baseUrl}/departments`;

  constructor(private http: HttpClient) {}

  getAgencies(includeDepartments = true): Observable<Organization[]> {
    const params = new HttpParams().set('includeDepartments', String(includeDepartments));
    return this.http.get<Organization[]>(this.agenciesUrl, { params });
  }

  getAgency(code: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.agenciesUrl}/${code}`);
  }

  createAgency(payload: CreateOrganizationPayload): Observable<Organization> {
    return this.http.post<Organization>(this.agenciesUrl, payload);
  }

  updateAgency(code: string, payload: Partial<CreateOrganizationPayload>): Observable<Organization> {
    return this.http.patch<Organization>(`${this.agenciesUrl}/${code}`, payload);
  }

  deleteAgency(code: string): Observable<void> {
    return this.http.delete<void>(`${this.agenciesUrl}/${code}`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.deptsUrl);
  }

  getDepartment(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.deptsUrl}/${id}`);
  }

  createDepartment(payload: CreateDepartmentPayload): Observable<Department> {
    return this.http.post<Department>(this.deptsUrl, payload);
  }

  updateDepartment(id: string, payload: Partial<CreateDepartmentPayload>): Observable<Department> {
    return this.http.patch<Department>(`${this.deptsUrl}/${id}`, payload);
  }
}
