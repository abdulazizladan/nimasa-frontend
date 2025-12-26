import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeliverablesDashboard } from './deliverables-dashboard/deliverables-dashboard';
import { DeliverableDetails } from './deliverable-details/deliverable-details';
import { DeliverableForm } from './deliverable-form/deliverable-form';

const routes: Routes = [
  { path: '', component: DeliverablesDashboard },
  { path: 'new', component: DeliverableForm },
  { path: ':id', component: DeliverableDetails },
  { path: ':id/edit', component: DeliverableForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DeliverablesRoutingModule { }
