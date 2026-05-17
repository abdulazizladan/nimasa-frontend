import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MinisterialDeliverable {
  id: string;
  priorityArea: string;
  deliverable: string;
  indicator: string;
  baseline2023?: number;
  sourceOfEvidence?: string;
  evidenceFile?: string;
  yearlyPerformance?: Record<string, any>;
  projections?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
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

@Injectable({ providedIn: 'root' })
export class MinisterialDeliverablesService {
  private readonly base = `${environment.baseUrl}/ministerial-deliverables/deliverables`;
  private readonly deptBase = `${environment.baseUrl}/departments`;
  private readonly agencyBase = `${environment.baseUrl}/agency-deliverables`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MinisterialDeliverable[]> {
    return this.http.get<MinisterialDeliverable[]>(this.base);
  }

  getOne(id: string): Observable<MinisterialDeliverable> {
    return this.http.get<MinisterialDeliverable>(`${this.base}/${id}`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.deptBase);
  }

  getPriorityAreas(): Observable<{ id: string; name: string }[]> {
    return this.http.get<{ id: string; name: string }[]>(`${this.agencyBase}/priority-areas`);
  }

  create(dto: Partial<MinisterialDeliverable>): Observable<MinisterialDeliverable> {
    return this.http.post<MinisterialDeliverable>(this.base, dto);
  }

  createPriorityArea(name: string): Observable<any> {
    return this.http.post<any>(`${this.agencyBase}/priority-areas`, { name });
  }

  update(id: string, dto: Partial<MinisterialDeliverable>): Observable<MinisterialDeliverable> {
    return this.http.patch<MinisterialDeliverable>(`${this.base}/${id}`, dto);
  }
}
