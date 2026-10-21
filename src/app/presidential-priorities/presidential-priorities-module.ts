import { NgModule } from '@angular/core';

import { PresidentialPrioritiesRoutingModule } from './presidential-priorities-routing-module';
import { StrategicDeliverablesSharedModule } from '../strategic-deliverables/strategic-deliverables-shared-module';

@NgModule({
  imports: [StrategicDeliverablesSharedModule, PresidentialPrioritiesRoutingModule],
})
export class PresidentialPrioritiesModule {}
