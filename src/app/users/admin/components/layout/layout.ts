import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../../auth/store/auth.store';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private authStore = inject(AuthStore);

  /** Whether the "log out?" confirmation is showing */
  confirmingLogout = false;

  logout() {
    this.confirmingLogout = true;
  }

  confirmLogout() {
    this.confirmingLogout = false;
    this.authStore.logout();
  }
}
