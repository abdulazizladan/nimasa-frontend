import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MinisterialDeliverablesList } from './components/ministerial-deliverables-list/ministerial-deliverables-list';

const routes: Routes = [
  { path: '', component: MinisterialDeliverablesList }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MinisterialDeliverablesRoutingModule {}

