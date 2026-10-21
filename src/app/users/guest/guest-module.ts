import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GuestRoutingModule } from './guest-routing-module';
import { GuestLayout } from './guest-layout/guest-layout';
import { GuestDashboard } from './guest-dashboard/guest-dashboard';
import { DeliverablesOverview } from '../../strategic-deliverables/components/deliverables-overview/deliverables-overview';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog';

@NgModule({
  declarations: [GuestLayout, GuestDashboard],
  imports: [CommonModule, FormsModule, GuestRoutingModule, DeliverablesOverview, ConfirmDialog],
})
export class GuestModule {}
