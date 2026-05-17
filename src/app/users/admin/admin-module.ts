import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing-module';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Settings } from './components/settings/settings';

@NgModule({
  declarations: [Layout, Dashboard, Settings],
  imports: [CommonModule, FormsModule, AdminRoutingModule],
})
export class AdminModule {}
