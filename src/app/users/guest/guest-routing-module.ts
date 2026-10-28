import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GuestLayout } from './guest-layout/guest-layout';
import { GuestDashboard } from './guest-dashboard/guest-dashboard';
import { GuestKpis } from './guest-kpis/guest-kpis';
import { GuestKpi } from './guest-kpi/guest-kpi';
import { GuestReports } from './guest-reports/guest-reports';

const routes: Routes = [
  {
    path: '',
    component: GuestLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: GuestDashboard },
      { path: 'kpis', component: GuestKpis },
      { path: 'kpis/:id', component: GuestKpi },
      { path: 'reports', component: GuestReports }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GuestRoutingModule {}
