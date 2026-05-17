import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import { UserService, User } from '../services/user.service';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({
    users: [] as User[],
    selectedUser: null as User | null,
    loading: false,
    saving: false,
    error: null as string | null,
  }),
  withMethods((store, userService = inject(UserService)) => ({
    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => userService.getUsers().pipe(
          tap((data: any) => {
            let usersData = [];
            if (Array.isArray(data)) {
              usersData = data;
            } else if (data && Array.isArray(data.data)) {
              usersData = data.data;
            } else if (data && Array.isArray(data.users)) {
              usersData = data.users;
            } else {
              usersData = data ? [data] : [];
            }
            patchState(store, { users: usersData, loading: false });
          }),
          catchError((err) => {
            patchState(store, { error: err.error?.message || 'Failed to load users.', loading: false });
            return of(null);
          })
        ))
      )
    ),
    loadUser: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null, selectedUser: null })),
        switchMap((email) => userService.getUser(email).pipe(
          tap((data) => patchState(store, { selectedUser: data, loading: false })),
          catchError((err) => {
            patchState(store, { error: err.error?.message || 'Failed to load user details.', loading: false });
            return of(null);
          })
        ))
      )
    ),
    createUser: rxMethod<{ payload: any; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ payload, onSuccess }) => userService.createUser(payload).pipe(
          tap(() => {
            patchState(store, { saving: false });
            onSuccess();
          }),
          catchError((err) => {
            patchState(store, { error: err.error?.message || 'Failed to create user.', saving: false });
            return of(null);
          })
        ))
      )
    ),
    updateUser: rxMethod<{ email: string; payload: any; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        switchMap(({ email, payload, onSuccess }) => userService.updateUser(email, payload).pipe(
          tap((updatedUser) => {
            patchState(store, { saving: false, selectedUser: updatedUser });
            onSuccess();
          }),
          catchError((err) => {
            patchState(store, { error: err.error?.message || 'Failed to update user.', saving: false });
            return of(null);
          })
        ))
      )
    ),
    deleteUser: rxMethod<string>(
      pipe(
        switchMap((email) => userService.deleteUser(email).pipe(
          tap(() => {
            patchState(store, { users: store.users().filter((u) => u.email !== email) });
          }),
          catchError((err) => {
            alert(err.error?.message || 'Failed to delete user.');
            return of(null);
          })
        ))
      )
    ),
    clearError() {
      patchState(store, { error: null });
    }
  }))
);
