import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Interface for the supporting departments structure
export interface SupportingDept {
  deptCode: string;
  aor: string; // Area of Responsibility
}

// Interface for the form's full data structure
export interface ProjectFormData {
  projectTitle: string;
  description: string;
  expectedStartDate: Date;
  expectedCompletionDate: Date;
  primaryDepartment: string;
  supportingDepartments: SupportingDept[];
  actualCompletionDate?: Date | null;
  performanceScore?: number | null;
}

@Component({
  selector: 'app-project-dialog',
  standalone: false,
  templateUrl: './add-project.html',
  styleUrls: ['./add-project.scss']
})
export class AddProject implements OnInit {
  
  projectForm: FormGroup;
  
  // Example list of departments for the select dropdowns
  departmentOptions: string[] = ['MSR', 'FLG', 'CAP', 'F&A', 'HCD', 'ICT'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddProject>,
    @Inject(MAT_DIALOG_DATA) public data: ProjectFormData // Optional: for editing existing data
  ) {
    // Initialize the form with FormBuilder
    this.projectForm = this.fb.group({
      projectTitle: ['', Validators.required],
      description: ['', Validators.required],
      
      // Date Pickers
      expectedStartDate: [null, Validators.required],
      expectedCompletionDate: [null, Validators.required],
      
      // Departments
      primaryDepartment: ['', Validators.required],
      supportingDepartments: this.fb.array([]), // Initialize as an empty FormArray
      
      // Optional/Post-Completion Fields
      actualCompletionDate: [null],
      performanceScore: [null, [Validators.min(0), Validators.max(100)]]
    });

    // If editing, populate the form
    if (data) {
      this.projectForm.patchValue(data);
      data.supportingDepartments.forEach(dept => {
        this.addSupportingDepartment(dept);
      });
    }
  }

  ngOnInit(): void {
    // Start with at least one supporting department field set
    if (this.supportingDepartments.length === 0) {
      this.addSupportingDepartment();
    }
  }

  // --- FormArray Getters and Methods ---

  // Getter to easily access the supportingDepartments FormArray in the template
  get supportingDepartments(): FormArray {
    return this.projectForm.get('supportingDepartments') as FormArray;
  }

  // Creates a new FormGroup for a supporting department
  createSupportingDepartment(dept: SupportingDept = { deptCode: '', aor: '' }): FormGroup {
    return this.fb.group({
      deptCode: [dept.deptCode, Validators.required],
      aor: [dept.aor, Validators.required]
    });
  }

  // Adds a new supporting department FormGroup to the FormArray
  addSupportingDepartment(dept?: SupportingDept): void {
    this.supportingDepartments.push(this.createSupportingDepartment(dept));
  }

  // Removes a supporting department FormGroup from the FormArray
  removeSupportingDepartment(index: number): void {
    this.supportingDepartments.removeAt(index);
  }

  // --- Dialog Actions ---
  
  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      // Close the dialog and pass the form value back to the component that opened it
      this.dialogRef.close(this.projectForm.value);
    } else {
      // Mark all fields as touched to display validation errors
      this.projectForm.markAllAsTouched();
    }
  }
}