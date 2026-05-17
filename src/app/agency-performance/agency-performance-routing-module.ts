import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgencyDeliverablesList } from './components/agency-deliverables-list/agency-deliverables-list';

const routes: Routes = [
  {
    path: '',
    component: AgencyDeliverablesList
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgencyPerformanceRoutingModule {}
