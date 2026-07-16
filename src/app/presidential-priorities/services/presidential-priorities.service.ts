import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PresidentialPriority {
  id: string;
  serialNumber: number;
  /** ministry field in the entity — used here as the responsible ministry name */
  ministry: string;
  priorityArea: string;
  outcome: string;
  deliverable: string;
  baselineType: string;
  indicator: string;
  baselineYear?: number;
  baseline2023?: number;
  yearlyPerformance?: Record<string, any>;
  projections?: Record<string, number>;
  responsibleDepartment: string;
  supportingEvidence: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriorityArea {
  id: string;
  name: string;
  description?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  head: string;
  directorEmail?: string;
  contactPhone?: string;
}

export interface QueryPrioritiesParams {
  ministry?: string;
  priorityArea?: string;
  responsibleDepartment?: string;
  year?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PresidentialPrioritiesService {
  private readonly base = `${environment.baseUrl}/presidential-priorities`;
  private readonly deptBase = `${environment.baseUrl}/departments`;
  private readonly agencyBase = `${environment.baseUrl}/agency-deliverables`;

  constructor(private http: HttpClient) {}

  getAll(query?: QueryPrioritiesParams): Observable<PresidentialPriority[]> {
    let params = new HttpParams();
    if (query?.ministry) params = params.set('ministry', query.ministry);
    if (query?.priorityArea) params = params.set('priorityArea', query.priorityArea);
    if (query?.responsibleDepartment) params = params.set('responsibleDepartment', query.responsibleDepartment);
    if (query?.year) params = params.set('year', query.year.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());
    return this.http.get<PresidentialPriority[]>(this.base, { params });
  }

  getOne(id: string): Observable<PresidentialPriority> {
    return this.http.get<PresidentialPriority>(`${this.base}/${id}`);
  }

  getPriorityAreas(): Observable<PriorityArea[]> {
    return this.http.get<PriorityArea[]>(`${this.agencyBase}/priority-areas`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.deptBase);
  }

  create(dto: Partial<PresidentialPriority>): Observable<PresidentialPriority> {
    return this.http.post<PresidentialPriority>(this.base, dto);
  }

  update(id: string, dto: Partial<PresidentialPriority>): Observable<PresidentialPriority> {
    return this.http.patch<PresidentialPriority>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  createPriorityArea(name: string): Observable<PriorityArea> {
    return this.http.post<PriorityArea>(`${this.agencyBase}/priority-areas`, { name });
  }

  createSubmission(deliverableId: string, submission: any): Observable<any> {
    const payload = { ...submission, deliverableId };
    return this.http.post<any>(`${environment.baseUrl}/quarterly-reports`, payload);
  }
}
