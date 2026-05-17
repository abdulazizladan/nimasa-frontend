import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AgencyPerformanceRoutingModule } from './agency-performance-routing-module';
import { AgencyDeliverablesList } from './components/agency-deliverables-list/agency-deliverables-list';

@NgModule({
  declarations: [AgencyDeliverablesList],
  imports: [CommonModule, FormsModule, HttpClientModule, AgencyPerformanceRoutingModule],
})
export class AgencyPerformanceModule {}
