import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PresidentialPrioritiesList } from './components/presidential-priorities-list/presidential-priorities-list';

const routes: Routes = [
  { path: '', component: PresidentialPrioritiesList }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PresidentialPrioritiesRoutingModule {}

