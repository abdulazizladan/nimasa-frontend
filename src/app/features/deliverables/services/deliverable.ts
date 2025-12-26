import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../../../environment/environment';
import { Deliverable, DeliverableSummary } from '../models/deliverable.model';

@Injectable({
  providedIn: 'root'
})
export class DeliverableService {
  private apiUrl = `${env.baseUrl}deliverables`;

  constructor(private http: HttpClient) { }

  getAll(filters?: any): Observable<Deliverable[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<Deliverable[]>(this.apiUrl, { params });
  }

  getOne(id: string): Observable<Deliverable> {
    return this.http.get<Deliverable>(`${this.apiUrl}/${id}`);
  }

  create(deliverable: Partial<Deliverable>): Observable<Deliverable> {
    return this.http.post<Deliverable>(this.apiUrl, deliverable);
  }

  update(id: string, deliverable: Partial<Deliverable>): Observable<Deliverable> {
    return this.http.patch<Deliverable>(`${this.apiUrl}/${id}`, deliverable);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSummary(): Observable<DeliverableSummary> {
    return this.http.get<DeliverableSummary>(`${this.apiUrl}/summary`);
  }

  exportToCsv(deliverables: Deliverable[]): void {
    const headers = [
      'Serial Number', 'Ministry', 'Priority Area', 'Outcome', 'Deliverable',
      'Baseline Type', 'Indicator', 'Baseline 2023', 'Q1 2024 Target', 'Q1 2024 Actual',
      'Q2 2024 Target', 'Q2 2024 Actual', 'Q2 2024 Cumulative', 'Q3 2024 Target',
      'Q3 2024 Actual', 'Q3 2024 Cumulative', 'Q4 2024 Target', 'Q4 2024 Actual',
      'Annual 2024 Target', 'Annual 2024 Actual', 'Target 2025', 'Target 2026',
      'Target 2027', 'Responsible Department', 'Supporting Evidence'
    ];

    const csvData = deliverables.map(d => [
      d.serialNumber, d.ministry, d.priorityArea, d.outcome, d.deliverable,
      d.baselineType, d.indicator, d.baseline2023 || '', d.q1_2024_target || '',
      d.q1_2024_actual || '', d.q2_2024_target || '', d.q2_2024_actual || '',
      d.q2_2024_cumulative_actual || '', d.q3_2024_target || '', d.q3_2024_actual || '',
      d.q3_2024_cumulative_actual || '', d.q4_2024_target || '', d.q4_2024_actual || '',
      d.annual_2024_target || '', d.annual_2024_actual || '', d.target_2025 || '',
      d.target_2026 || '', d.target_2027 || '', d.responsibleDepartment,
      d.supportingEvidence
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deliverables_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
