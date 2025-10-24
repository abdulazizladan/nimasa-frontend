import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { OrganizationService } from '../services/organization';
import { Organization } from '../models/organization.model';
import { Department } from '../models/department.model';
import { pipe, map, tap } from 'rxjs'; // Added for potential future use or completion

export interface OrganizationStoreState { // Renamed to OrganizationStoreState to avoid conflict with the store class name
    organization: Organization | null;
    selectedDepartment: Department | null;
    isLoading: boolean;
    error: string | null;
    search: string;
}

const initialState: OrganizationStoreState = {
    organization: null,
    selectedDepartment: null,
    isLoading: false,
    error: null,
    search: ''
}

export const OrganizationStore = signalStore(
    { providedIn: 'root'},
    withState(initialState),
    withComputed(({ organization, search }) => ({
        // Computed signal to filter departments based on search string
        filteredDepartments: computed(() => {
            if (!organization()?.departments) {
                return [];
            }
            const searchTerm = search().toLowerCase().trim();
            if (!searchTerm) {
                return organization()!.departments;
            }
            return organization()!.departments.filter(dept =>
                dept.name.toLowerCase().includes(searchTerm) ||
                dept.code.toLowerCase().includes(searchTerm) ||
                dept.head.toLowerCase().includes(searchTerm) // Added head search for better usability
            );
        }),
        // Other computed signals can go here
    })),
    withMethods((store, organizationService = inject(OrganizationService)) => ({
        async loadOrganization() {
            patchState(store, { isLoading: true, error: null});
            try {
                const data = await organizationService.getOrganization()

                patchState(store, {organization: data, isLoading: false})
            } catch (error: any) {
                patchState(store, {
                    isLoading: false,
                    error: error?.message ?? 'Failed to load organization data'
                });
            }
        },
        // New method to update the search state
        updateSearch(searchTerm: string) {
            patchState(store, { search: searchTerm });
        },
        // Potential method to select a department (optional for this task, but good practice)
        selectDepartment(department: Department | null) {
            patchState(store, { selectedDepartment: department });
        }
    }))
)