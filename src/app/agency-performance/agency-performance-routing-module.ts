import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { deliverablesRoutes } from '../strategic-deliverables/strategic-deliverables-shared-module';
import { AGENCY_CONFIG } from '../strategic-deliverables/deliverables-config';

@NgModule({
  imports: [RouterModule.forChild(deliverablesRoutes(AGENCY_CONFIG))],
  exports: [RouterModule],
})
export class AgencyPerformanceRoutingModule {}
