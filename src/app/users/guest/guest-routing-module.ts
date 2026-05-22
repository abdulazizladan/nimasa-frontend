import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GuestDashboard } from './guest-dashboard/guest-dashboard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: GuestDashboard }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GuestRoutingModule {}
