import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrganizationRoutingModule } from './organization-routing-module';
import { OrganizationDashboard } from './components/organization-dashboard/organization-dashboard';
import { DepartmentDetail } from './components/department-detail/department-detail';
import { Modal } from '../core/components/modal/modal';
import { Icon } from '../core/components/icon/icon';
import { YearSelect } from '../core/components/year-select/year-select';

@NgModule({
  declarations: [OrganizationDashboard, DepartmentDetail],
  imports: [CommonModule, FormsModule, OrganizationRoutingModule, Modal, Icon, YearSelect],
})
export class OrganizationModule {}
