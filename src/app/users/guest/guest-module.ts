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
import { PortalLayout } from '../../core/components/portal-layout/portal-layout';
import { Icon } from '../../core/components/icon/icon';
import { YearSelect } from '../../core/components/year-select/year-select';

@NgModule({
  declarations: [GuestLayout, GuestDashboard, GuestKpis, GuestKpi, GuestReports],
  imports: [
    CommonModule, FormsModule, GuestRoutingModule,
    DeliverablesOverview, QuarterSparkline, KpiQuarterChart, PeriodPicker, PortalLayout, Icon, YearSelect
  ],
})
export class GuestModule {}
