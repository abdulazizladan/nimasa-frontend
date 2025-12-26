Step 1: Create Deliverables Module
# Navigate to Angular project
cd <frontend-path>
# Generate module
ng generate module features/deliverables --routing
# Generate components
ng generate component features/deliverables/deliverables-dashboard
ng generate component features/deliverables/deliverable-details
ng generate component features/deliverables/deliverable-form
# Generate service
ng generate service features/deliverables/services/deliverable
Step 2: Create Models
File: src/app/features/deliverables/models/deliverable.model.ts

export interface Deliverable {
  id: string;
  serialNumber: number;
  ministry: string;
  priorityArea: string;
  outcome: string;
  deliverable: string;
  baselineType: string;
  indicator: string;
  baseline2023?: number;
  q1_2024_target?: number;
  q1_2024_actual?: number;
  q2_2024_target?: number;
  q2_2024_actual?: number;
  q2_2024_cumulative_actual?: number;
  q3_2024_target?: number;
  q3_2024_actual?: number;
  q3_2024_cumulative_actual?: number;
  q4_2024_target?: number;
  q4_2024_actual?: number;
  annual_2024_target?: number;
  annual_2024_actual?: number;
  target_2025?: number;
  target_2026?: number;
  target_2027?: number;
  responsibleDepartment: string;
  supportingEvidence: string;
  createdAt: Date;
  updatedAt: Date;
}
Step 3: Implement Service
File: src/app/features/deliverables/services/deliverable.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Deliverable } from '../models/deliverable.model';
@Injectable({
  providedIn: 'root'
})
export class DeliverableService {
  private apiUrl = `${environment.apiUrl}/deliverables`;
  constructor(private http: HttpClient) {}
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
  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/summary`);
  }
}
Step 4: Dashboard Component
Component: Displays summary cards, filters, and data table

Features:

Summary cards (Total deliverables, Ministries, Progress)
Filters (Ministry, Priority Area, Department)
Mat-table with sorting and pagination (10 rows default)
Export to CSV functionality
Step 5: Details Component
Component: Shows full deliverable details with charts

Features:

All deliverable fields
Quarterly progress chart (targets vs actuals)
Multi-year targets visualization
Timeline view
Step 6: Form Component
Component: Create/Edit deliverable form

Features:

Reactive forms with validation
Multi-step form (Identification → Baseline → Quarterly Data → Future Targets)
Auto-calculate cumulative values
Form state management
Step 7: Install Charts Library
npm install ng2-charts chart.js
Configure charts for quarterly visualization and trend analysis.

Step 8: Routing Configuration
File: src/app/features/deliverables/deliverables-routing.module.ts

const routes: Routes = [
  { path: '', component: DeliverablesDashboardComponent },
  { path: 'new', component: DeliverableFormComponent },
  { path: ':id', component: DeliverableDetailsComponent },
  { path: ':id/edit', component: DeliverableFormComponent }
];
Add to main application routing with role guards.

Verification Plan
Backend Tests
Navigate to Swagger UI: http://localhost:3000/api
Test each endpoint with sample data
Verify filtering and querying work correctly
Check data validation and error handling
Frontend Tests
Verify all components render correctly
Test filters and pagination
Ensure charts display accurate data
Test form validation and submission
Verify responsive design on mobile/tablet