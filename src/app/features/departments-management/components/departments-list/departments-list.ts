import { Component, OnInit, inject } from '@angular/core';
import { DepartmentsStore } from '../../stores/departments.store';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
//import { AddDepartmentDialogComponent } from '../add-department-dialog/add-department-dialog.component';
//import { AddUnitDialogComponent } from '../add-unit-dialog/add-unit-dialog.component';
//import { ManageUnitsDialogComponent } from '../manage-units-dialog/manage-units-dialog.component';

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
}