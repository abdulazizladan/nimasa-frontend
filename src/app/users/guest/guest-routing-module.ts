import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GuestLayout } from './guest-layout/guest-layout';
import { GuestDashboard } from './guest-dashboard/guest-dashboard';

const routes: Routes = [
  {
    path: '',
    component: GuestLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: GuestDashboard }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GuestRoutingModule {}
