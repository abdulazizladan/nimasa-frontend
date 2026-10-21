import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes } from '@angular/router';

import { DeliverablesList } from './components/deliverables-list/deliverables-list';
import { QuarterlyReportDetail } from './components/quarterly-report-detail/quarterly-report-detail';
import { StrategicDeliverablesService } from './services/strategic-deliverables.service';
import { StrategicDeliverablesStore } from './store/strategic-deliverables.store';
import { DELIVERABLES_CONFIG, DeliverablesConfig } from './deliverables-config';

/** List and report-details pages shared by the presidential priorities and ministerial deliverables modules. */
@NgModule({
  declarations: [DeliverablesList, QuarterlyReportDetail],
  imports: [CommonModule, FormsModule],
  exports: [DeliverablesList, QuarterlyReportDetail],
})
export class StrategicDeliverablesSharedModule {}

/**
 * Routes for one deliverables page. Each page gets its own config, service and store,
 * so presidential and ministerial data never mix.
 */
export function deliverablesRoutes(config: DeliverablesConfig): Routes {
  return [
    {
      path: '',
      providers: [
        { provide: DELIVERABLES_CONFIG, useValue: config },
        StrategicDeliverablesService,
        StrategicDeliverablesStore
      ],
      children: [
        { path: '', component: DeliverablesList },
        { path: ':id/reports/:year/:quarter', component: QuarterlyReportDetail }
      ]
    }
  ];
}
