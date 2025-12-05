import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizationSummary } from './components/organization-summary/organization-summary';
import { DepartmentDetails } from './components/department-details/department-details';
import { DepartmentPerformance } from './components/department-performance/department-performance';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'summary',
    pathMatch: 'full'
  },
  {
    path: 'summary',
    component: OrganizationSummary
  },
  {
    path: 'department/:code',
    component: DepartmentDetails
  },
  {
    path: 'department/:code/performance',
    component: DepartmentPerformance
  },
  {
    path: '**',
    redirectTo: 'summary',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationManagementRoutingModule { }
