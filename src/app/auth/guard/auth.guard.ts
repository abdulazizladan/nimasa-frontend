import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../store/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  private authStore = inject(AuthStore)
  constructor(private router: Router) {}

  canActivate(): boolean {
    if (this.authStore.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/auth/login']);
    return false;
  }
}
