import { inject, Injectable, signal, computed, DestroyRef } from '@angular/core'; // <-- Added DestroyRef
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { pipe, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // <-- Added takeUntilDestroyed
import { Department, DepartmentFilter, Unit } from '../models/department.model';
import { DepartmentsService } from '../services/departments-service';

interface DepartmentsState {
  departments: Department[];
  units: Unit[];
  isLoading: boolean;
  error: string | null;
  filters: DepartmentFilter;
}

const initialState: DepartmentsState = {
  departments: [],
  units: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: [],
    performance: '',
    maritimeDomain: '',
    strategicPillar: ''
  }
};
@Injectable()
export class DepartmentsStore extends signalStore(
  withState<DepartmentsState>(initialState),
  withComputed(({ departments, filters }) => ({
    // ... (Computed properties are correct) ...
    filteredDepartments: computed(() => { /* ... */ return departments(); }),
    totalDepartments: computed(() => departments().length),
    // ... (Other computed properties) ...
  })),
  withMethods((
    store, 
    departmentsService = inject(DepartmentsService),
    destroyRef = inject(DestroyRef)
  ) => ({
    
    // ✅ State updaters using patchState()
    setLoading(isLoading: boolean): void {
      patchState(store, { // <-- CORRECT
        isLoading,
        error: isLoading ? null : store.error()
      });
    },
    
    setError(error: string | null): void {
      patchState(store, { error, isLoading: false }); // <-- CORRECT
    },
    
    setDepartments(departments: Department[]): void {
      patchState(store, { departments }); // <-- CORRECT
    },
    
    setUnits(units: Unit[]): void {
      patchState(store, { units }); // <-- CORRECT
    },
    
    // ✅ Filter updaters using patchState() with state function for immutability
    setSearch(search: string): void {
      patchState(store, state => ({ filters: { ...state.filters, search } })); // <-- CORRECT
    },
    setStatusFilter(status: string[]): void {
      patchState(store, state => ({ filters: { ...state.filters, status } })); // <-- CORRECT
    },
    // ... (All other filter methods use this correct pattern) ...

    // ✅ Department CRUD operations using patchState() with state function
    addDepartment(department: Department): void {
      patchState(store, state => ({ departments: [...state.departments, department] })); // <-- CORRECT (Immutable array update)
    },
    
    updateDepartment(updatedDepartment: Department): void {
      patchState(store, state => ({
        departments: state.departments.map(dept => // <-- CORRECT (Immutable array update)
          dept.id === updatedDepartment.id ? updatedDepartment : dept
        )
      }));
    },
    
    deleteDepartment(departmentId: string): void {
      patchState(store, state => ({
        departments: state.departments.filter(dept => dept.id !== departmentId) // <-- CORRECT (Immutable array update)
      }));
    },
    
    // ... (Effects logic correctly calls the state updaters) ...
    
    // ✅ Reset filters using patchState()
    resetFilters(): void {
      patchState(store, { // <-- CORRECT
        filters: {
          search: '',
          status: [],
          performance: '',
          maritimeDomain: '',
          strategicPillar: ''
        }
      });
    },
    
    // ✅ Clear error using patchState()
    clearError(): void {
      patchState(store, { error: null }); // <-- CORRECT
    }
    
  }))
) {}