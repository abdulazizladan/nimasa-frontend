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
  /** Shown in the UI as "Deliverable" */
  outcome: string;
  /** Shown in the UI as "Description" */
  deliverable: string;
  baselineType: string;
  indicator: string;
  /** Year the baseline was measured; the KPI's report year is baselineYear + 1 */
  baselineYear?: number;
  /** Baseline value for baselineYear (column name is historical, not tied to 2023) */
  baseline2023?: number;
  /** Quarterly results keyed by year then q1..q4, synced by the backend from quarterly reports */
  yearlyPerformance?: Record<string, any>;
  /** Annual targets keyed by target year; derived by the backend from annualTargets */
  projections?: Record<string, number>;
  /** Annual targets, each with its own baseline */
  annualTargets?: AnnualTarget[];
  responsibleDepartment: string;
  supportingEvidence: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnualTarget {
  baselineYear: number;
  baselineValue?: number | null;
  targetYear: number;
  targetValue: number;
}

export interface QuarterlyReport {
  id: string;
  year: number;
  quarter: string;
  targetValue?: number;
  actualValue?: number;
  progress?: string;
  keyIssues?: string;
  mdaEfforts?: string;
  comments?: string;
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
  private readonly reportsBase = `${environment.baseUrl}/quarterly-reports`;

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

  updatePriorityArea(id: string, name: string): Observable<PriorityArea> {
    return this.http.patch<PriorityArea>(`${this.agencyBase}/priority-areas/${id}`, { name });
  }

  deletePriorityArea(id: string): Observable<void> {
    return this.http.delete<void>(`${this.agencyBase}/priority-areas/${id}`);
  }

  createSubmission(deliverableId: string, submission: any): Observable<any> {
    const payload = { ...submission, deliverableId };
    return this.http.post<any>(this.reportsBase, payload);
  }

  getSubmissions(deliverableId: string, year?: number, quarter?: string): Observable<QuarterlyReport[]> {
    let params = new HttpParams().set('deliverableId', deliverableId);
    if (year) params = params.set('year', year.toString());
    if (quarter) params = params.set('quarter', quarter);
    return this.http.get<QuarterlyReport[]>(this.reportsBase, { params });
  }

  updateSubmission(id: string, submission: Partial<QuarterlyReport>): Observable<QuarterlyReport> {
    return this.http.patch<QuarterlyReport>(`${this.reportsBase}/${id}`, submission);
  }

  deleteSubmission(id: string): Observable<void> {
    return this.http.delete<void>(`${this.reportsBase}/${id}`);
  }
}
