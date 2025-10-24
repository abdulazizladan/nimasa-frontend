import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { env } from '../../../../environment/environment';
import { Organization } from '../models/organization.model'; // Assuming Department is exported from here
import { Department } from '../models/department.model';
import { firstValueFrom, throwError } from 'rxjs'; // Added throwError for a better service structure
import { catchError } from 'rxjs/operators'; // Import operators from rxjs/operators

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = env.baseUrl;

  getOrganization(): Promise<Organization> {
    return firstValueFrom (
      this.http.get<Organization>(`${this.baseUrl}organization/NIMASA`).pipe(
        // Add a basic error handler to the pipe for robustness
        catchError(error => {
          console.error('Error fetching organization:', error);
          return throwError(() => new Error('Failed to fetch organization data'));
        })
      )
    );
  }

  // Placeholder method to get a single department by code
  getDepartmentByCode(code: string): Promise<Department> {
    return firstValueFrom (
      this.http.get<Department>(`${this.baseUrl}department/code/${code}`).pipe(
        catchError(error => {
          console.error(`Error fetching department ${code}:`, error);
          return throwError(() => new Error(`Failed to fetch department ${code}`));
        })
      )
    );
  }

  // Placeholder method to add a department
  addDepartment(department: Omit<Department, 'id'>): Promise<Department> {
    // Note: Department model likely needs an 'id' or is generated on the backend
    // Assuming a POST request for creation
    return firstValueFrom(
      this.http.post<Department>(`${this.baseUrl}departments`, department).pipe(
        catchError(error => {
          console.error('Error adding department:', error);
          return throwError(() => new Error('Failed to add department'));
        })
      )
    );
  }
}