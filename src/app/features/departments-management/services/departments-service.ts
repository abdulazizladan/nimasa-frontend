import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department, Unit } from '../models/department.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'api/departments';

  // State-loading methods
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }

  getUnitsByDepartment(departmentId: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/${departmentId}/units`);
  }

  // CRUD methods
  createDepartment(department: Omit<Department, 'id'>): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, department);
  }

  // Used by the store to update performance
  updateDepartmentPerformance(id: string, performanceScore: number): Observable<Department> {
    return this.http.patch<Department>(`${this.apiUrl}/${id}/performance`, { performanceScore });
  }

  // Already present but supports store utility/future needs
  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`);
  }

  updateDepartment(id: string, department: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${id}`, department);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // NIMASA-specific methods (Already present)
  getDepartmentsByMaritimeDomain(domain: string): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}?maritimeDomain=${domain}`);
  }

  getPerformanceReport(fiscalYear: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/performance?fiscalYear=${fiscalYear}`);
  }
}