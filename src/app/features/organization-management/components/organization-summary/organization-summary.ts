import { Component, inject, OnInit } from '@angular/core';
import { OrganizationStore } from '../../store/organization.store';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-organization-summary',
  standalone: false,
  templateUrl: './organization-summary.html',
  styleUrl: './organization-summary.scss'
})
export class OrganizationSummary implements OnInit {
  public store = inject(OrganizationStore);

  // Columns to display in the Mat-Table
  public displayedColumns: string[] = ['code', 'name', 'head', 'description'];

  ngOnInit(): void {
    // Load organization data when the component initializes
    this.store.loadOrganization();
  }

  // Event handler for search input
  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.store.updateSearch(inputElement.value);
  }

  // Helper for mat-table's trackBy
  trackDepartment(index: number, item: Department): string {
    return item.id || item.code; // Use id or fallback to code
  }
}
