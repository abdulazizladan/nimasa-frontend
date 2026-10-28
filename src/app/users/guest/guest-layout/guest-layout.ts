import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../auth/store/auth.store';

/** Shell for the guest portal: top bar plus Dashboard, KPIs, Reports and Logout (a sidebar, or tabs on phones). */
@Component({
  selector: 'app-guest-layout',
  standalone: false,
  templateUrl: './guest-layout.html',
  // Same look as the admin portal, plus bottom tabs on phones
  styleUrls: ['../../admin/components/layout/layout.css', './guest-layout.css'],
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
