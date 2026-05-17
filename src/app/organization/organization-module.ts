import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { OrganizationRoutingModule } from './organization-routing-module';
import { OrganizationDashboard } from './components/organization-dashboard/organization-dashboard';

@NgModule({
  declarations: [OrganizationDashboard],
  imports: [CommonModule, FormsModule, HttpClientModule, OrganizationRoutingModule],
})
export class OrganizationModule {}
