import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DepartmentsStore } from '../../stores/departments.store';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
//import { AddDepartmentDialogComponent } from '../add-department-dialog/add-department-dialog.component';
//import { AddUnitDialogComponent } from '../add-unit-dialog/add-unit-dialog.component';
//import { ManageUnitsDialogComponent } from '../manage-units-dialog/manage-units-dialog.component';

// --- Type Definitions ---
interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  head: string;
  directorEmail: string;
  contactPhone: string;
}

interface Agency {
  code: string;
  name: string;
  motto: string;
  logo: string;
  isActive: boolean;
  departments: Department[];
}

export interface NimsaDepartment {
  code: string;
  name: string;
  head: string;
}

@Component({
  selector: 'app-departments-list',
  standalone: false,
  templateUrl: './departments-list.html',
  styleUrl: './departments-list.scss',
  providers: [DepartmentsStore] // Provide at component level
})
export class DepartmentsList implements OnInit {

  displayedColumns: string[] = ['code', 'name', 'head', 'action'];

  // 3. Define the hardcoded data source for the mat-table
  dataSource: NimsaDepartment[] = [
    { code: 'MSR', name: 'Maritime Safety & Security', head: 'Mr. A. Olumide' },
    { code: 'FLG', name: 'Flag State Control', head: 'Ms. B. Ngozi' },
    { code: 'CAP', name: 'Cabotage & Port Services', head: 'Engr. C. Ibrahim' },
    { code: 'F&A', name: 'Finance and Administration', head: 'Dr. D. Adekunle' },
    { code: 'HCD', name: 'Human Capital Development', head: 'Mrs. E. Okoro' },
  ];
  
  readonly store = inject(DepartmentsStore);
  private readonly dialog = inject(MatDialog);

  // Filter controls
  searchControl = new FormControl('');
  statusFilterControl = new FormControl([]);
  performanceFilterControl = new FormControl('');

  ngOnInit(): void {
    //this.store.loadDepartments();

    // React to filter changes
    this.searchControl.valueChanges.subscribe(search => {
      this.store.setSearch(search ?? '');
    });

    this.statusFilterControl.valueChanges.subscribe(statuses => {
      this.store.setStatusFilter(statuses ?? []);
    });

    this.performanceFilterControl.valueChanges.subscribe(performance => {
      //this.store.setPerformanceFilter(performance ?? '');
    });
  }

  // All computed properties are now directly available from the store
  // No need for getters anymore!

  /**openAddDepartmentDialog(): void {
    this.dialog.open(AddDepartmentDialogComponent, {
      width: '600px',
      maxHeight: '90vh'
    });
  }

  openAddUnitDialog(): void {
    this.dialog.open(AddUnitDialogComponent, {
      width: '500px',
      maxHeight: '90vh'
    });
  }

  manageUnits(department: any): void {
    this.dialog.open(ManageUnitsDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { department }
    });
  }**/

  editDepartment(department: any): void {
    console.log('Edit department:', department);
  }

  viewPerformanceReport(department: any): void {
    console.log('View performance report for:', department);
  }

  exportPerformanceReport(): void {
    console.log('Exporting performance report...');
  }

  resetFilters(): void {
    this.store.resetFilters();
    this.searchControl.setValue('');
    this.statusFilterControl.setValue([]);
    this.performanceFilterControl.setValue('');
  }

// New stuff

isLoading = signal(false);
private initialData: Agency = {
  "code": "NIMASA",
  "name": "Nigerian Maritime Administration and Safety Agency",
  "motto": "Safe, Secure and Efficient Shipping", // Added a dummy motto for better presentation
  "logo": "https://nimasa.gov.ng/wp-content/uploads/2019/08/logo-843x1024.jpg",
  "isActive": true,
  "departments": [
    {
      "id": "68eab410-0768-4317-850b-2dd495c4fd09",
      "code": "MSR",
      "name": "Marine Safety and Security",
      "description": "Responsible for driving revenue and client acquisition.",
      "head": "Mr. A. Olumide",
      "directorEmail": "",
      "contactPhone": ""
    },
    {
      "id": "7b4fc85d-b286-4467-8d29-e2682594a9be",
      "code": "FLG",
      "name": "Flag State Control",
      "description": "Manages vessel registration and compliance with international standards.",
      "head": "Ms B Ngozi",
      "directorEmail": "",
      "contactPhone": ""
    },
    {
      "id": "7cd71897-efe8-41ac-9b9e-aefd3622214a",
      "code": "CAP",
      "name": "Cabotage and Port Services",
      "description": "Oversees coastal trade and port operations.",
      "head": "Engr. C. Ibrahim",
      "directorEmail": "",
      "contactPhone": ""
    },
    {
      "id": "",
      "code": "F&A",
      "name": "Finance and Administration",
      "description": "Handling budget, payroll, and general administrative duties.",
      "head": "Dr. D. Adekunle",
      "directorEmail": "",
      "contactPhone": ""
    },
    {
      "id": "biuh",
      "code": "HCD",
      "name": "Human Capital Development",
      "description": "Focuses on staff training, recruitment, and welfare.",
      "head": "Mrs. E. Okoro",
      "directorEmail": "",
      "contactPhone": ""
    }
  ]
};

// Signal for the main agency data
agency = signal<Agency>(this.initialData);

// Computed signal for department count
departmentsCount = computed(() => this.agency().departments.length);

// Column definitions for the Angular Material Table
displayedColumns2: string[] = ['code', 'name', 'head', 'description', 'actions'];

constructor() {
  // A simple timeout to simulate data fetching (and show the progress bar)
  this.isLoading.set(true);
  setTimeout(() => {
    this.isLoading.set(false);
  }, 1000);
}
}