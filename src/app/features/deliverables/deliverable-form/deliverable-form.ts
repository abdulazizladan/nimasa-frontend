import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Deliverable } from '../models/deliverable.model';
import { DeliverableService } from '../services/deliverable';

@Component({
  selector: 'app-deliverable-form',
  standalone: false,
  templateUrl: './deliverable-form.html',
  styleUrl: './deliverable-form.scss'
})
export class DeliverableForm implements OnInit {
  deliverableForm: FormGroup;
  isEditMode = false;
  deliverableId: string | null = null;
  currentStep = 0;
  isLoading = false;
  error: string | null = null;

  steps = [
    'Identification',
    'Baseline',
    'Quarterly Data',
    'Future Targets'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private deliverableService: DeliverableService
  ) {
    this.deliverableForm = this.createForm();
  }

  ngOnInit(): void {
    this.deliverableId = this.route.snapshot.paramMap.get('id');
    if (this.deliverableId) {
      this.isEditMode = true;
      this.loadDeliverable(this.deliverableId);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Identification
      serialNumber: ['', Validators.required],
      ministry: ['', Validators.required],
      priorityArea: ['', Validators.required],
      outcome: ['', Validators.required],
      deliverable: ['', Validators.required],
      responsibleDepartment: ['', Validators.required],

      // Baseline
      baselineType: ['', Validators.required],
      indicator: ['', Validators.required],
      baseline2023: [null],

      // Quarterly 2024
      q1_2024_target: [null],
      q1_2024_actual: [null],
      q2_2024_target: [null],
      q2_2024_actual: [null],
      q2_2024_cumulative_actual: [null],
      q3_2024_target: [null],
      q3_2024_actual: [null],
      q3_2024_cumulative_actual: [null],
      q4_2024_target: [null],
      q4_2024_actual: [null],
      annual_2024_target: [null],
      annual_2024_actual: [null],

      // Future targets
      target_2025: [null],
      target_2026: [null],
      target_2027: [null],

      supportingEvidence: ['']
    });
  }

  loadDeliverable(id: string): void {
    this.isLoading = true;
    this.deliverableService.getOne(id).subscribe({
      next: (deliverable) => {
        this.deliverableForm.patchValue(deliverable);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load deliverable. Please try again.';
        this.isLoading = false;
        console.error('Error loading deliverable:', err);
      }
    });
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  calculateCumulativeQ2(): void {
    const q1 = this.deliverableForm.get('q1_2024_actual')?.value || 0;
    const q2 = this.deliverableForm.get('q2_2024_actual')?.value || 0;
    this.deliverableForm.patchValue({ q2_2024_cumulative_actual: q1 + q2 });
  }

  calculateCumulativeQ3(): void {
    const cumQ2 = this.deliverableForm.get('q2_2024_cumulative_actual')?.value || 0;
    const q3 = this.deliverableForm.get('q3_2024_actual')?.value || 0;
    this.deliverableForm.patchValue({ q3_2024_cumulative_actual: cumQ2 + q3 });
  }

  onSubmit(): void {
    if (this.deliverableForm.invalid) {
      this.deliverableForm.markAllAsTouched();
      this.error = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const deliverableData = this.deliverableForm.value;

    const operation = this.isEditMode && this.deliverableId
      ? this.deliverableService.update(this.deliverableId, deliverableData)
      : this.deliverableService.create(deliverableData);

    operation.subscribe({
      next: () => {
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (err) => {
        this.error = 'Failed to save deliverable. Please try again.';
        this.isLoading = false;
        console.error('Error saving deliverable:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
