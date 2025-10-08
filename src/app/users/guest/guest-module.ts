import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { FlexLayoutModule } from '@angular/flex-layout';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { Dashboard } from './components/dashboard/dashboard';
import { GuestRoutingModule } from './guest-routing-module';
import { Layout } from './components/layout/layout';


@NgModule({
  providers: [
    provideHttpClient(),
    provideCharts(withDefaultRegisterables())
  ],
  declarations: [
    Layout,
    Dashboard
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatSidenavModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatCardModule,
    MatProgressBarModule,
    MatSelectModule,
    MatExpansionModule,
    MatTableModule,
    BaseChartDirective,
    GuestRoutingModule
  ]
})
export class GuestModule { }
