import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department, Unit } from '../models/department.model';
import { env } from '../../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = env.baseUrl;

  // State-loading methods
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}department`);
  }

  getUnitsByDepartment(departmentId: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.baseUrl}department/${departmentId}/units`);
  }

  // CRUD methods
  createDepartment(department: Omit<Department, 'id'>): Observable<Department> {
    return this.http.post<Department>(`${this.baseUrl}department`, department);
  }

  // Used by the store to update performance
  updateDepartmentPerformance(id: string, performanceScore: number): Observable<Department> {
    return this.http.patch<Department>(`${this.baseUrl}department/${id}/performance`, { performanceScore });
  }

  // Already present but supports store utility/future needs
  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.baseUrl}department/${id}`);
  }

  updateDepartment(id: string, department: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.baseUrl}department/${id}`, department);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}department/${id}`);
  }

  // NIMASA-specific methods (Already present)
  getDepartmentsByMaritimeDomain(domain: string): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}department?maritimeDomain=${domain}`);
  }

  getPerformanceReport(fiscalYear: string): Observable<any> {
    return this.http.get(`${this.baseUrl}department/reports/performance?fiscalYear=${fiscalYear}`);
  }
}