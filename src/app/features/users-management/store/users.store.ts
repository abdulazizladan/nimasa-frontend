import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { UsersService } from '../services/users';
import { User } from '../models/user.model';

export interface UsersState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}

const initialState: UsersState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  search: ''
};

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    // Removed redundant computed signals for users, isLoading, error, and search.
    // They are accessed directly from the store instance (e.g., store.users).
    filteredUsers: computed(() => {
      const term = state.search().trim().toLowerCase();
      if (!term) {
        return state.users();
      }

      // Reusable function to check if a value is included in the search term
      const includesTerm = (value: string | number | null | undefined): boolean => 
        String(value || '').toLowerCase().includes(term);

      return state.users().filter(u =>
        includesTerm(u.id) ||
        includesTerm(u.email) ||
        includesTerm(u.role) ||
        includesTerm(u.status) ||
        includesTerm(u.info?.firstName) ||
        includesTerm(u.info?.lastName) ||
        includesTerm(u.contact?.phone)
      );
    }),

    // New computed signals for summary counts, moved from the component
    totalUsers: computed(() => state.users().length),
    adminUsers: computed(() => state.users().filter(u => (u.role || '').toLowerCase() === 'admin').length),
    marketManagers: computed(() => state.users().filter(u => 
      ['manager', 'market manager', 'market_manager'].includes((u.role || '').toLowerCase())
    ).length),
    activeUsers: computed(() => state.users().filter(u => (u.status || '').toLowerCase() === 'active').length),
  })),
  withMethods((store, usersService = inject(UsersService)) => ({
    async loadUsers() {
      // 1. Set loading to true
      patchState(store, { isLoading: true, error: null });
      try {
        // This line is where the code might be hanging if findAll() doesn't resolve.
        const data = await usersService.findAll(); 
        
        // 2. Success: Update users and set loading to false
        patchState(store, { users: data, isLoading: false });
        console.log(data)
      } catch (error: any) {
        console.error('Error loading users:', error); // <-- Add console log for debugging
        
        // 3. Failure: Set error and set loading to false
        patchState(store, { 
            isLoading: false, 
            error: error?.message ?? 'Failed to load users' 
        });
      }
    },
    async addUser(payload: Partial<User>) {
      patchState(store, { isLoading: true, error: null});
      try {
        const created = await usersService.createUser(payload);
        // Correctly use store.users() to access the current value of the signal
        patchState(store, {users: [created, ...store.users()], isLoading: false}); 
        return created;
      } catch (error: any) {
        patchState(store, { isLoading: false, error: error?.message ?? 'Failed to add user'});
        throw error
      }
    },
    setSearch(value: string) {
      patchState(store, { search: value });
    },
    clearError() {
      patchState(store, { error: null });
    }
  }))
);