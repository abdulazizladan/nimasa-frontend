import { NgModule } from '@angular/core';

import { AgencyPerformanceRoutingModule } from './agency-performance-routing-module';
import { StrategicDeliverablesSharedModule } from '../strategic-deliverables/strategic-deliverables-shared-module';

@NgModule({
  imports: [StrategicDeliverablesSharedModule, AgencyPerformanceRoutingModule],
})
export class AgencyPerformanceModule {}
