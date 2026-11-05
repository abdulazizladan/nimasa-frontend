import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ROUTES } from '../../core/routes';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.parseUrl(ROUTES.login);
  return auth.isAdmin() ? router.parseUrl(ROUTES.admin.root) : true;
};
