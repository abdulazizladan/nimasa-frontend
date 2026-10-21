import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationDashboard } from './components/organization-dashboard/organization-dashboard';
import { DepartmentDetail } from './components/department-detail/department-detail';

const routes: Routes = [
  { path: '', component: OrganizationDashboard },
  // Departments are addressed by code: some existing departments have ids the API can't look up
  { path: 'departments/:code', component: DepartmentDetail }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationRoutingModule {}
