import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GuestRoutingModule } from './guest-routing-module';
import { GuestLayout } from './guest-layout/guest-layout';
import { GuestDashboard } from './guest-dashboard/guest-dashboard';
import { GuestKpis } from './guest-kpis/guest-kpis';
import { GuestKpi } from './guest-kpi/guest-kpi';
import { GuestReports } from './guest-reports/guest-reports';
import { DeliverablesOverview } from '../../strategic-deliverables/components/deliverables-overview/deliverables-overview';
import { QuarterSparkline } from '../../strategic-deliverables/components/quarter-sparkline/quarter-sparkline';
import { KpiQuarterChart } from '../../strategic-deliverables/components/kpi-quarter-chart/kpi-quarter-chart';
import { PeriodPicker } from '../../strategic-deliverables/components/period-picker/period-picker';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog';

@NgModule({
  declarations: [GuestLayout, GuestDashboard, GuestKpis, GuestKpi, GuestReports],
  imports: [
    CommonModule, FormsModule, GuestRoutingModule,
    DeliverablesOverview, QuarterSparkline, KpiQuarterChart, PeriodPicker, ConfirmDialog
  ],
})
export class GuestModule {}
