import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, concatMap, catchError, of } from 'rxjs';
import { UserService, User, CreateUserDto, UpdateUserDto } from '../services/user.service';
import { apiErrorMessage } from '../../../core/api';

type WithCallback<T> = T & { onSuccess?: () => void };

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
          tap(users => patchState(store, { users, loading: false })),
          catchError(err => {
            patchState(store, { error: apiErrorMessage(err, 'Failed to load users.'), loading: false });
            return of(null);
          })
        ))
      )
    ),
    loadUser: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null, selectedUser: null })),
        switchMap(email => userService.getUser(email).pipe(
          tap(user => patchState(store, { selectedUser: user, loading: false })),
          catchError(err => {
            patchState(store, { error: apiErrorMessage(err, 'Failed to load user details.'), loading: false });
            return of(null);
          })
        ))
      )
    ),
    createUser: rxMethod<WithCallback<{ payload: CreateUserDto }>>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        concatMap(({ payload, onSuccess }) => userService.createUser(payload).pipe(
          tap(() => {
            patchState(store, { saving: false });
            onSuccess?.();
          }),
          catchError(err => {
            patchState(store, { error: apiErrorMessage(err, 'Failed to create user.'), saving: false });
            return of(null);
          })
        ))
      )
    ),
    updateUser: rxMethod<WithCallback<{ email: string; payload: UpdateUserDto }>>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        concatMap(({ email, payload, onSuccess }) => userService.updateUser(email, payload).pipe(
          tap(updated => {
            patchState(store, { saving: false, selectedUser: updated });
            onSuccess?.();
          }),
          catchError(err => {
            patchState(store, { error: apiErrorMessage(err, 'Failed to update user.'), saving: false });
            return of(null);
          })
        ))
      )
    ),
    deleteUser: rxMethod<WithCallback<{ email: string }>>(
      pipe(
        tap(() => patchState(store, { saving: true, error: null })),
        concatMap(({ email, onSuccess }) => userService.deleteUser(email).pipe(
          tap(() => {
            patchState(store, { users: store.users().filter(u => u.email !== email), saving: false });
            onSuccess?.();
          }),
          catchError(err => {
            patchState(store, { error: apiErrorMessage(err, 'Failed to delete user.'), saving: false });
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
