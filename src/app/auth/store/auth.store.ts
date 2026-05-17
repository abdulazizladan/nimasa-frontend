import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState({
    user: null as any,
    token: null as string | null,
    loading: false,
    error: null as string | null,
  }),
  withMethods((store, authService = inject(Auth), router = inject(Router)) => ({
    initFromStorage() {
      const user = authService.getUser();
      const token = localStorage.getItem('access_token');
      if (user && token) {
        patchState(store, { user, token });
      }
    },
    login: rxMethod<any>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((credentials) => authService.login(credentials).pipe(
          tap((res: any) => {
            patchState(store, { user: res.user, token: res.access_token, loading: false });
            
            if (res.user && res.user.role === 'admin') {
              router.navigate(['/admin/dashboard']);
            } else {
              router.navigate(['/guest/dashboard']);
            }
          }),
          catchError((err) => {
            patchState(store, { error: err.error?.message || 'Login failed.', loading: false });
            return of(null);
          })
        ))
      )
    ),
    logout() {
      authService.logout();
      patchState(store, { user: null, token: null });
      router.navigate(['/']);
    }
  }))
);
