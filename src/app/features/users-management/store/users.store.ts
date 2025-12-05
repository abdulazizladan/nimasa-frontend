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
    // ... existing methods
    async loadUsers() {
      // 1. Set loading to true
      patchState(store, { isLoading: true, error: null });
      try {
        // This line is where the code might be hanging if findAll() doesn't resolve.
        const data = await usersService.findAll(); 
        
        // 2. Success: Update users and set loading to false
        patchState(store, { users: data, isLoading: false });
      } catch (error: any) {
        //console.error('Error loading users:', error); // <-- Add console log for debugging
        
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
    },
    // --- New Methods Added Below ---

    /**
     * Fetches a single user by email and sets it as the selectedUser.
     * @param email The email of the user to fetch.
     */
    async fetchUserByEmail(email: string) {
      patchState(store, { isLoading: true, error: null, selectedUser: null });
      try {
        const user = await usersService.findByEmail(email);
        
        // Patch the fetched user into selectedUser
        patchState(store, { selectedUser: user, isLoading: false });
        return user;
      } catch (error: any) {
        console.error('Error fetching user by email:', error);
        patchState(store, { 
            isLoading: false, 
            error: error?.message ?? `Failed to fetch user with email: ${email}` 
        });
        throw error; // Re-throw to allow component to handle the failure
      }
    },

    /**
     * Updates an existing user and reflects the change in the 'users' array and 'selectedUser'.
     * @param id The ID of the user to update.
     * @param payload The partial user data to update.
     */
    async updateUser(id: string, payload: Partial<User>) {
      patchState(store, { isLoading: true, error: null });
      try {
        const updatedUser = await usersService.update(id, payload);
        
        // 1. Update the 'users' array: find the user by ID and replace it.
        const updatedUsers = store.users().map(u => 
          u.id === updatedUser.id ? updatedUser : u
        );

        // 2. Update 'selectedUser' if the updated user is the currently selected one.
        const selectedUser = store.selectedUser();
        const newSelectedUser = selectedUser && String(selectedUser.id) === String(id)
            ? updatedUser
            : selectedUser;

        patchState(store, { 
            users: updatedUsers, 
            selectedUser: newSelectedUser, 
            isLoading: false 
        });
        
        return updatedUser;
      } catch (error: any) {
        console.error('Error updating user:', error);
        patchState(store, { 
            isLoading: false, 
            error: error?.message ?? `Failed to update user with ID: ${id}` 
        });
        throw error; // Re-throw to allow component to handle the failure
      }
    }
  }))
);