import { NgModule } from '@angular/core';

import { MinisterialDeliverablesRoutingModule } from './ministerial-deliverables-routing-module';
import { StrategicDeliverablesSharedModule } from '../strategic-deliverables/strategic-deliverables-shared-module';

@NgModule({
  imports: [StrategicDeliverablesSharedModule, MinisterialDeliverablesRoutingModule],
})
export class MinisterialDeliverablesModule {}
