import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../auth/store/auth.store';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  get isDashboard(): boolean {
    return this.router.url === '/admin/dashboard' || this.router.url === '/admin';
  }

  logout() {
    this.authStore.logout();
  }
}
