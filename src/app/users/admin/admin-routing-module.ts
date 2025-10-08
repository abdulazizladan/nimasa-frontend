import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from '../guest/components/dashboard/dashboard';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'users',
        loadChildren: () => import('../../features/users-management/users-management-module').then(module => module.UsersManagementModule)
      },
      {
        path: 'departments',
        loadChildren: () => import('../../features/departments-management/departments-management-module').then(module => module.DepartmentsManagementModule)
      },
      {
        path: 'projects',
        loadChildren: () => import('../../features/projects-management/projects-management-module').then(module => module.ProjectstsManagementModule)
      },
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
