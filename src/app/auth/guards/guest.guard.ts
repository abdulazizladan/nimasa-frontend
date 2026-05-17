import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    if (authService.isAdmin()) {
      return router.parseUrl('/admin');
    }
    return true;
  }

  return router.parseUrl('/auth/login');
};
