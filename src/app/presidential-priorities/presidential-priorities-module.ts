import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { PresidentialPrioritiesRoutingModule } from './presidential-priorities-routing-module';
import { PresidentialPrioritiesList } from './components/presidential-priorities-list/presidential-priorities-list';
import { QuarterlyReportDetail } from './components/quarterly-report-detail/quarterly-report-detail';

@NgModule({
  declarations: [PresidentialPrioritiesList, QuarterlyReportDetail],
  imports: [CommonModule, FormsModule, HttpClientModule, PresidentialPrioritiesRoutingModule],
})
export class PresidentialPrioritiesModule {}

