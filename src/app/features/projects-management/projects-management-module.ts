import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { FlexLayoutModule } from '@angular/flex-layout';

import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';

import { ProjectsManagementRoutingModule } from './projects-management-routing-module';
import { ProjectsList } from './components/projects-list/projects-list';
import { ProjectDetails } from './components/project-details/project-details';
import { AddProject } from './components/add-project/add-project';


@NgModule({
  providers: [
    provideHttpClient(),
    provideNativeDateAdapter()
  ],
  declarations: [
    ProjectsList,
    ProjectDetails,
    AddProject,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatDialogModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatStepperModule,
    MatDatepickerModule,
    MatDividerModule,
    ProjectsManagementRoutingModule
  ]
})
export class ProjectstsManagementModule { }
