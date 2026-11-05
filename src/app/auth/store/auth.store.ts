import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../services/auth.service';
import { ROUTES } from '../../core/routes';
import { apiErrorMessage } from '../../core/api';

/** Login form state. The session itself lives in AuthService (localStorage). */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState({
    loading: false,
    error: null as string | null,
  }),
  withMethods((store, auth = inject(AuthService), router = inject(Router)) => ({
    login: rxMethod<LoginRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(credentials => auth.login(credentials).pipe(
          tap(res => {
            patchState(store, { loading: false });
            router.navigateByUrl(res.user?.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.guest.dashboard);
          }),
          catchError(err => {
            patchState(store, { error: apiErrorMessage(err, 'Login failed. Check your email and password.'), loading: false });
            return of(null);
          })
        ))
      )
    ),
    logout() {
      auth.logout();
      router.navigateByUrl(ROUTES.login);
    },
  }))
);
