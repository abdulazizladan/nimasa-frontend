import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AgencyDeliverable {
  id: string;
  serialNumber: number;
  /** Backend field name is `ministry` but represents an agency in NIMASA context */
  ministry: string;
  priorityArea: string;
  outcome: string;
  deliverable: string;
  baselineType: string;
  indicator: string;
  baseline2023?: number;
  yearlyPerformance?: Record<string, any>;
  projections?: Record<string, number>;
  responsibleDepartment: string;
  supportingEvidence: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverablesSummary {
  totalDeliverables: number;
  /** Backend returns `totalMinistries` — represents agencies in NIMASA context */
  totalMinistries: number;
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

export interface QueryDeliverablesParams {
  ministry?: string;
  priorityArea?: string;
  responsibleDepartment?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AgencyDeliverablesService {
  private readonly base = `${environment.baseUrl}/agency-deliverables`;
  private readonly deptBase = `${environment.baseUrl}/departments`;

  constructor(private http: HttpClient) {}

  getAll(query?: QueryDeliverablesParams): Observable<AgencyDeliverable[]> {
    let params = new HttpParams();
    if (query?.ministry) params = params.set('ministry', query.ministry);
    if (query?.priorityArea) params = params.set('priorityArea', query.priorityArea);
    if (query?.responsibleDepartment) params = params.set('responsibleDepartment', query.responsibleDepartment);
    if (query?.limit) params = params.set('limit', query.limit.toString());
    return this.http.get<AgencyDeliverable[]>(this.base, { params });
  }

  getOne(id: string): Observable<AgencyDeliverable> {
    return this.http.get<AgencyDeliverable>(`${this.base}/${id}`);
  }

  getSummary(): Observable<DeliverablesSummary> {
    return this.http.get<DeliverablesSummary>(`${this.base}/summary`);
  }

  getPriorityAreas(): Observable<{ id: string; name: string }[]> {
    return this.http.get<{ id: string; name: string }[]>(`${this.base}/priority-areas`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.deptBase);
  }

  create(dto: Partial<AgencyDeliverable>): Observable<AgencyDeliverable> {
    return this.http.post<AgencyDeliverable>(this.base, dto);
  }

  createSubmission(deliverableId: string, submission: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${deliverableId}/submissions`, submission);
  }
}
