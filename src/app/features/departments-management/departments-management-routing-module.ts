import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DepartmentsList } from './components/departments-list/departments-list';
import { DepartmentDetails } from './components/department-details/department-details';

const routes: Routes = [
  {
    path: '',
    component: DepartmentsList
  },
  {
    path: 'department/:code',
    component: DepartmentDetails
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepartmentsManagementRoutingModule { }
