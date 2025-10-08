import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectsList } from './components/projects-list/projects-list';
import { ProjectDetails } from './components/project-details/project-details';

const routes: Routes = [
  {
    path: '',
    component: ProjectsList
  },
  {
    path: 'project/:id',
    component: ProjectDetails
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
export class ProjectsManagementRoutingModule { }
