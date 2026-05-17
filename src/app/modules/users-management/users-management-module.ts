import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersManagementRoutingModule } from './users-management-routing-module';
import { UsersList } from './users-list/users-list';
import { UserDetails } from './user-details/user-details';
import { AddUser } from './add-user/add-user';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [UsersList, UserDetails, AddUser],
  imports: [CommonModule, UsersManagementRoutingModule, FormsModule],
})
export class UsersManagementModule {}
