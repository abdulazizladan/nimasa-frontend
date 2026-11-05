import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../../core/components/modal/modal';
import { Icon } from '../../../core/components/icon/icon';
import { DeliverablesConfig } from '../../deliverables-config';
import {
  StrategicDeliverable, PriorityArea, AnnualAggregation, PerformanceDirection
} from '../../services/strategic-deliverables.service';
import { Department } from '../../../core/services/reference-data.service';
import { AGGREGATION_LABELS, DIRECTION_LABELS, getAggregation, isLowerBetter } from '../../utils/kpi-performance';
import {
  AnnualTargetRow, buildDeliverablePayload, newTargetRow, nextTargetYear, targetRowsFor, validateDeliverableForm
} from '../../utils/deliverable-form';

/**
 * Create / edit form for one deliverable, in a modal. Emits the request body on save; the
 * parent saves it and closes the form (by removing it) when the store reports success.
 */
@Component({
  selector: 'app-deliverable-form',
  standalone: true,
  imports: [FormsModule, Modal, Icon],
  templateUrl: './deliverable-form.html',
  styleUrl: './deliverable-form.css',
})
export class DeliverableForm implements OnInit {
  config = input.required<DeliverablesConfig>();
  /** The deliverable being edited, or null for a new one */
  deliverable = input<StrategicDeliverable | null>(null);
  priorityAreas = input.required<PriorityArea[]>();
  departments = input.required<Department[]>();
  saving = input(false);
  /** Error from the last save attempt */
  serverError = input<string | null>(null);

  save = output<Partial<StrategicDeliverable>>();
  cancel = output<void>();

  readonly aggregationOptions = Object.entries(AGGREGATION_LABELS) as [AnnualAggregation, string][];
  readonly directionOptions = Object.entries(DIRECTION_LABELS) as [PerformanceDirection, string][];

  form: Partial<StrategicDeliverable> = {};
  currentYear = new Date().getFullYear();
  rows: AnnualTargetRow[] = [];
  formError = signal('');

  ngOnInit(): void {
    const existing = this.deliverable();
    if (existing) {
      this.form = {
        ...existing,
        annualAggregation: getAggregation(existing),
        performanceDirection: isLowerBetter(existing) ? 'lower' : 'higher'
      };
      this.currentYear = existing.baselineYear ? existing.baselineYear + 1 : new Date().getFullYear();
      this.rows = targetRowsFor(existing, this.currentYear);
    } else {
      this.form = this.emptyForm();
      this.currentYear = new Date().getFullYear();
      this.rows = [newTargetRow(this.currentYear)];
    }
  }

  get isEdit(): boolean {
    return !!this.deliverable();
  }

  private emptyForm(): Partial<StrategicDeliverable> {
    const config = this.config();
    return {
      ministry: config.defaultMinistry,
      priorityArea: '',
      outcome: '',
      deliverable: '',
      baselineType: 'Percentage',
      indicator: '',
      baselineYear: new Date().getFullYear() - 1,
      responsibleDepartment: '',
      supportingEvidence: '',
      category: config.defaultCategory,
      annualAggregation: 'sum',
      performanceDirection: 'higher'
    };
  }

  onCurrentYearChange(year: number): void {
    const previous = this.currentYear;
    this.currentYear = year;
    this.form.baselineYear = year - 1;
    // Keep the first annual target row in step with the current year if the user hasn't changed its years
    const first = this.rows[0];
    if (first && first.targetYear === previous && first.baselineYear === previous - 1) {
      first.targetYear = year;
      first.baselineYear = year - 1;
    }
  }

  addRow(): void {
    this.rows = [...this.rows, newTargetRow(nextTargetYear(this.rows, this.currentYear))];
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  submit(): void {
    const year = Number(this.currentYear);
    const error = validateDeliverableForm(this.form, year, this.rows);
    this.formError.set(error);
    if (error) return;
    this.save.emit(buildDeliverablePayload(this.form, year, this.rows, this.config().showMinistry));
  }
}
