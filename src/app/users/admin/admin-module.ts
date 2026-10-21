import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing-module';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Settings } from './components/settings/settings';
import { DeliverablesOverview } from '../../strategic-deliverables/components/deliverables-overview/deliverables-overview';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog';

@NgModule({
  declarations: [Layout, Dashboard, Settings],
  imports: [CommonModule, FormsModule, AdminRoutingModule, DeliverablesOverview, ConfirmDialog],
})
export class AdminModule {}
