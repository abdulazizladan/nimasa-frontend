import { Component } from '@angular/core';
import { NavItem } from '../../../core/components/portal-layout/portal-layout';
import { ROUTES } from '../../../core/routes';

/** Guest portal shell: the shared layout with Dashboard, KPIs and Reports. */
@Component({
  selector: 'app-guest-layout',
  standalone: false,
  template: `<app-portal-layout brand="Guest Portal" initial="G" [navItems]="navItems"></app-portal-layout>`,
})
export class GuestLayout {
  readonly navItems: NavItem[] = [
    { path: ROUTES.guest.dashboard, label: 'Dashboard', icon: 'dashboard' },
    { path: ROUTES.guest.kpis, label: 'KPIs', icon: 'trending' },
    { path: ROUTES.guest.reports, label: 'Reports', icon: 'document' },
  ];
}
