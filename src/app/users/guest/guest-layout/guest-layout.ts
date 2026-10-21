import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../auth/store/auth.store';

/** Shell for the guest portal: top bar plus a sidebar with Dashboard and Logout. */
@Component({
  selector: 'app-guest-layout',
  standalone: false,
  templateUrl: './guest-layout.html',
  // Same look as the admin portal
  styleUrl: '../../admin/components/layout/layout.css',
})
export class GuestLayout {
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
