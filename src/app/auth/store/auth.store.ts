import { computed, inject, NgZone } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { Auth, LoginRequest } from '../services/auth';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { LoginData } from '../models/loginData.model';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userRole: string | null;
  userEmail: string| null;
  error: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  userRole: null,
  userEmail: null,
  loading: false,
  error: null
};


export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authService = inject(Auth), router = inject(Router), zone = inject(NgZone)) => ({
    async login(data: LoginData) {
      patchState(store, { 
        loading: true, 
        error: null 
      });
      try {
        // Ensure data matches LoginRequest type (email: string, password: string)
        if (!data.email || !data.password) {
          throw new Error('Email and password are required.');
        }
        // Cast data to LoginRequest to satisfy type checker
        const loginRequest: LoginRequest = {
          email: data.email,
          password: data.password
        };
        // Await the Observable<LoginResponse> as a promise
        const response = await authService.login(loginRequest);
        console.log(`response: ${response}`)
        const decodedToken = jwtDecode(response) as any;

        patchState(store, {
          token: response,
          isAuthenticated: true,
          userRole: decodedToken.role,
          userEmail: decodedToken.email,
          error: null,
          loading: false
        });

        // Redirect based on role
        switch (decodedToken.role) {
          case 'admin':
            router.navigate(['/admin']);
            break;
          case 'guest':
            router.navigate(['/guest']);
            break;
          default:
            router.navigate(['**']);
        }
      } catch (error) {
        patchState(store, {
          error: 'Login failed. Check your login details and try again.',
          loading: false
        });
      }
    },

    logout() {
      localStorage.removeItem('auth_token');
      patchState(store, {loading: false, error: null, isAuthenticated: false, token: null, userRole: null, userEmail: null});
      router.navigate(['/auth/login']);
    }
  }))
);
