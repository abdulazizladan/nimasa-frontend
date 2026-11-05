import { Component, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../auth/store/auth.store';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { Icon, IconName } from '../icon/icon';
import { Toasts } from '../toasts/toasts';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

/**
 * Shell shared by the admin and guest portals: top bar, side navigation (a row of tabs along the
 * bottom on phones), the routed page, toasts, and the "log out?" confirmation.
 */
@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog, Icon, Toasts],
  templateUrl: './portal-layout.html',
  styleUrl: './portal-layout.css',
})
export class PortalLayout {
  private authStore = inject(AuthStore);

  /** e.g. "Admin Portal" */
  brand = input.required<string>();
  navItems = input.required<NavItem[]>();
  /** Letter shown in the profile circle */
  initial = input('');

  /** Whether the "log out?" confirmation is showing */
  confirmingLogout = signal(false);

  logout(): void {
    this.confirmingLogout.set(true);
  }

  confirmLogout(): void {
    this.confirmingLogout.set(false);
    this.authStore.logout();
  }
}
