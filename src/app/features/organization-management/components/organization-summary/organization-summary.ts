import { Component, inject, OnInit, signal } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OrganizationStore } from '../../store/organization.store';
import { Department } from '../../models/department.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PriorityArea } from '../../models/priorityArea.model';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-organization-summary',
  standalone: false,
  templateUrl: './organization-summary.html',
  styleUrls: ['./organization-summary.scss'],
})
export class OrganizationSummary implements OnInit {
  readonly store = inject(OrganizationStore);

    // Form control for the search input
    searchControl = new FormControl('');

    // Table columns for Priority Areas
    readonly priorityAreaColumns: string[] = ['area', 'expand'];
    readonly deliverableColumns: string[] = ['description', 'outputIndicators'];

    // State for expanded rows in the Mat Table
    expandedArea = signal<PriorityArea | null>(null);

    constructor() {
        // Subscribe to the search control value changes to update the store
        this.searchControl.valueChanges
            .pipe(
                debounceTime(300), // Debounce to prevent excessive store updates
                distinctUntilChanged(),
                takeUntilDestroyed()
            )
            .subscribe((searchTerm) => {
                // Update the search state in the store
                this.store.updateSearch(searchTerm || '');
            });
    }

    ngOnInit(): void {
        // Load the organization data when the component initializes
        this.store.loadOrganization();
    }

    /**
     * Toggles the expansion state of a Priority Area row in the mat-table.
     * @param area The PriorityArea to expand/collapse.
     */
    toggleAreaExpansion(area: PriorityArea): void {
        this.expandedArea.update(current => current === area ? null : area);
    }

  
}
