import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GuestRoutingModule } from './guest-routing-module';
import { GuestDashboard } from './guest-dashboard/guest-dashboard';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [GuestDashboard],
  imports: [CommonModule, GuestRoutingModule, FormsModule],
})
export class GuestModule {}
