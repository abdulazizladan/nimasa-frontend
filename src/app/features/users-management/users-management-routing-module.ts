import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersListComponent } from './components/users-list/users-list';
import { UserDetails } from './components/user-details/user-details';

const routes: Routes = [
  {
    path: '',
    component: UsersListComponent
  },
  {
    path: 'user/:email',
    component: UserDetails
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
export class UsersManagementRoutingModule { }
