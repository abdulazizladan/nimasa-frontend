import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Settings } from './components/settings/settings';

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
        loadChildren: () => import('../../modules/users-management/users-management-module').then(m => m.UsersManagementModule)
      },
      {
        path: 'agency-deliverables',
        loadChildren: () => import('../../agency-performance/agency-performance-module').then(m => m.AgencyPerformanceModule)
      },
      {
        path: 'priorities',
        loadChildren: () => import('../../presidential-priorities/presidential-priorities-module').then(m => m.PresidentialPrioritiesModule)
      },
      {
        path: 'deliverables',
        loadChildren: () => import('../../ministerial-deliverables/ministerial-deliverables-module').then(m => m.MinisterialDeliverablesModule)
      },
      {
        path: 'organization',
        loadChildren: () => import('../../organization/organization-module').then(m => m.OrganizationModule)
      },
      {
        path: 'settings',
        component: Settings
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
