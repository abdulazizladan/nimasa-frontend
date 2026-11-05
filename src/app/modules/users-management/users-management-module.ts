import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsersManagementRoutingModule } from './users-management-routing-module';
import { UsersList } from './users-list/users-list';
import { UserDetails } from './user-details/user-details';
import { AddUser } from './add-user/add-user';
import { Icon } from '../../core/components/icon/icon';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog';

@NgModule({
  declarations: [UsersList, UserDetails, AddUser],
  imports: [CommonModule, FormsModule, UsersManagementRoutingModule, Icon, ConfirmDialog],
})
export class UsersManagementModule {}
