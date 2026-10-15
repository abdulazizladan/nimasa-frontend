import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PresidentialPrioritiesList } from './components/presidential-priorities-list/presidential-priorities-list';
import { QuarterlyReportDetail } from './components/quarterly-report-detail/quarterly-report-detail';

const routes: Routes = [
  { path: '', component: PresidentialPrioritiesList },
  { path: ':id/reports/:year/:quarter', component: QuarterlyReportDetail }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PresidentialPrioritiesRoutingModule {}

