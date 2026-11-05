import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DeliverablesList } from './components/deliverables-list/deliverables-list';
import { DeliverableForm } from './components/deliverable-form/deliverable-form';
import { QuarterlyReportForm } from './components/quarterly-report-form/quarterly-report-form';
import { PriorityAreasTab } from './components/priority-areas-tab/priority-areas-tab';
import { QuarterlyReportDetail } from './components/quarterly-report-detail/quarterly-report-detail';
import { StrategicDeliverablesService } from './services/strategic-deliverables.service';
import { StrategicDeliverablesStore } from './store/strategic-deliverables.store';
import {
  DELIVERABLES_CONFIG, DeliverablesConfig, PRESIDENTIAL_CONFIG, MINISTERIAL_CONFIG, AGENCY_CONFIG
} from './deliverables-config';
import { KpiQuarterChart } from './components/kpi-quarter-chart/kpi-quarter-chart';
import { ConfirmDialog } from '../core/components/confirm-dialog/confirm-dialog';
import { Icon } from '../core/components/icon/icon';
import { YearSelect } from '../core/components/year-select/year-select';

/** List and report-details pages shared by the presidential, ministerial and agency deliverables pages. */
@NgModule({
  declarations: [DeliverablesList, QuarterlyReportDetail],
  imports: [
    CommonModule, FormsModule, RouterModule, KpiQuarterChart, ConfirmDialog, Icon, YearSelect,
    DeliverableForm, QuarterlyReportForm, PriorityAreasTab
  ],
  exports: [DeliverablesList, QuarterlyReportDetail],
})
export class StrategicDeliverablesSharedModule {}

/**
 * Routes for one deliverables page. Each page gets its own config, service and store, so the
 * three pages never share data by accident.
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

/** Lazy-loaded page modules: one per configuration (see users/admin/admin-routing-module.ts). */
@NgModule({ imports: [StrategicDeliverablesSharedModule, RouterModule.forChild(deliverablesRoutes(PRESIDENTIAL_CONFIG))] })
export class PresidentialPrioritiesModule {}

@NgModule({ imports: [StrategicDeliverablesSharedModule, RouterModule.forChild(deliverablesRoutes(MINISTERIAL_CONFIG))] })
export class MinisterialDeliverablesModule {}

@NgModule({ imports: [StrategicDeliverablesSharedModule, RouterModule.forChild(deliverablesRoutes(AGENCY_CONFIG))] })
export class AgencyDeliverablesModule {}
