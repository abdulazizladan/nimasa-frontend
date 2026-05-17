import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UsersList } from './users-list/users-list';
import { AddUser } from './add-user/add-user';
import { UserDetails } from './user-details/user-details';

const routes: Routes = [
  { path: '', component: UsersList },
  { path: 'add', component: AddUser },
  { path: ':email', component: UserDetails }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersManagementRoutingModule {}
