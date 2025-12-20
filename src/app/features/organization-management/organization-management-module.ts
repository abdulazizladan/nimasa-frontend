import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { FlexLayoutModule } from '@angular/flex-layout';

import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';

import { OrganizationManagementRoutingModule } from './organization-management-routing-module';
import { OrganizationSummary } from './components/organization-summary/organization-summary';
import { DepartmentDetails } from './components/department-details/department-details';
import { DepartmentPerformance } from './components/department-performance/department-performance';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  providers: [
    provideHttpClient(),
    provideCharts(withDefaultRegisterables())
  ],
  declarations: [
    OrganizationSummary,
    DepartmentDetails,
    DepartmentPerformance
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatDialogModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatExpansionModule,
    MatExpansionModule,
    OrganizationManagementRoutingModule,
    BaseChartDirective
  ]
})
export class OrganizationManagementModule { }
