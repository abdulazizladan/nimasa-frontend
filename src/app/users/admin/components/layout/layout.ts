import { Component } from '@angular/core';
import { NavItem } from '../../../../core/components/portal-layout/portal-layout';
import { ROUTES } from '../../../../core/routes';

/** Admin portal shell: the shared layout with the admin navigation. */
@Component({
  selector: 'app-layout',
  standalone: false,
  template: `<app-portal-layout brand="Admin Portal" initial="A" [navItems]="navItems"></app-portal-layout>`,
})
export class Layout {
  readonly navItems: NavItem[] = [
    { path: ROUTES.admin.dashboard, label: 'Dashboard', icon: 'dashboard' },
    { path: ROUTES.admin.users, label: 'Users', icon: 'users' },
    { path: ROUTES.admin.organization, label: 'Organization', icon: 'building' },
    { path: ROUTES.admin.presidential, label: 'Presidential Priorities', icon: 'star' },
    { path: ROUTES.admin.ministerial, label: 'Ministerial Deliverables', icon: 'briefcase' },
    { path: ROUTES.admin.agency, label: 'Agency Deliverables', icon: 'chart' },
    { path: ROUTES.admin.settings, label: 'Settings', icon: 'settings' },
  ];
}
