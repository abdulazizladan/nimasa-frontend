import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MinisterialDeliverablesRoutingModule } from './ministerial-deliverables-routing-module';
import { MinisterialDeliverablesList } from './components/ministerial-deliverables-list/ministerial-deliverables-list';

@NgModule({
  declarations: [MinisterialDeliverablesList],
  imports: [CommonModule, FormsModule, HttpClientModule, MinisterialDeliverablesRoutingModule],
})
export class MinisterialDeliverablesModule {}

