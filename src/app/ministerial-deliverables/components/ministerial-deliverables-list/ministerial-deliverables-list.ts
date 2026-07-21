import { Component, OnInit, inject, computed } from '@angular/core';
import { MinisterialDeliverablesStore } from '../../store/ministerial-deliverables.store';
import { MinisterialDeliverable } from '../../services/ministerial-deliverables.service';

@Component({
  selector: 'app-ministerial-deliverables-list',
  standalone: false,
  templateUrl: './ministerial-deliverables-list.html',
  styleUrl: './ministerial-deliverables-list.css',
})
export class MinisterialDeliverablesList implements OnInit {
  store = inject(MinisterialDeliverablesStore);

  searchText = '';
  searchPriorityArea = '';
  expandedId: string | null = null;

  // Add modal state variables
  showAddModal = false;
  showAddAreaModal = false;
  newAreaName = '';
  newDeliverable: Partial<MinisterialDeliverable> = this.getEmptyForm();

  // Quarterly Report Modal State
  showReportModal = false;
  selectedDeliverableId = '';
  newReport = {
    year: new Date().getFullYear(),
    quarter: 'Q1',
    targetValue: undefined as number | undefined,
    actualValue: undefined as number | undefined,
    progress: '',
    keyIssues: '',
    mdaEfforts: '',
    comments: ''
  };

  showSuccessModal = false;
  successMessage = '';

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => {
      this.showSuccessModal = false;
    }, 5000);
  }

  filteredDeliverables = computed(() => {
    const all = this.store.deliverables();
    const text = this.store.searchText().toLowerCase();
    const area = this.store.filterPriorityArea().toLowerCase();
    return all.filter(d => {
      const matchText = !text ||
        d.deliverable.toLowerCase().includes(text) ||
        d.indicator.toLowerCase().includes(text);
      const matchArea = !area || d.priorityArea.toLowerCase().includes(area);
      return matchText && matchArea;
    });
  });

  hasActiveFilter = computed(() =>
    !!this.store.searchText() || !!this.store.filterPriorityArea()
  );

  ngOnInit(): void {
    this.store.loadDeliverables();
    this.store.loadPriorityAreas();
    this.store.loadDepartments();
  }

  onSearchChange(): void {
    this.store.setSearchText(this.searchText);
  }

  onPriorityAreaChange(area: string): void {
    this.searchPriorityArea = area;
    this.store.setFilterPriorityArea(area);
  }

  clearFilters(): void {
    this.searchText = '';
    this.searchPriorityArea = '';
    this.store.setSearchText('');
    this.store.setFilterPriorityArea('');
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getQuarterStatus(actual: number, target: number): string {
    if (!target) return 'status-na';
    const pct = (actual / target) * 100;
    if (pct >= 90) return 'status-on-track';
    if (pct >= 60) return 'status-at-risk';
    return 'status-off-track';
  }

  getQuarterLabel(actual: number, target: number): string {
    if (!target) return 'N/A';
    const pct = (actual / target) * 100;
    if (pct >= 90) return 'On Track';
    if (pct >= 60) return 'At Risk';
    return 'Off Track';
  }

  getOverallStatusForDeliverable(d: any): string {
    if (!d.yearlyPerformance) return 'status-na';
    const years = Object.values(d.yearlyPerformance) as Record<string, any>[];
    let totalActual = 0, totalTarget = 0;
    years.forEach(year => {
      Object.values(year).forEach((q: any) => {
        totalActual += q.actual ?? 0;
        totalTarget += q.target ?? 0;
      });
    });
    return this.getQuarterStatus(totalActual, totalTarget);
  }

  getEmptyForm(): Partial<MinisterialDeliverable> {
    return {
      priorityArea: '',
      deliverable: '',
      indicator: '',
      baseline2023: undefined,
      sourceOfEvidence: '',
      evidenceFile: ''
    };
  }

  openAddModal(): void {
    this.newDeliverable = this.getEmptyForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.store.clearError();
  }

  submitAdd(): void {
    if (!this.newDeliverable.priorityArea || !this.newDeliverable.deliverable || !this.newDeliverable.indicator) {
      alert('Please fill in all required fields (Priority Area, Deliverable, and KPI/Indicator).');
      return;
    }

    if (this.newDeliverable.baseline2023) {
      this.newDeliverable.baseline2023 = Number(this.newDeliverable.baseline2023);
    }

    // Call store rxMethod to save
    this.store.createDeliverable(this.newDeliverable);

    // Watch loading and error states to close modal on success
    const interval = setInterval(() => {
      if (!this.store.loading()) {
        clearInterval(interval);
        if (!this.store.error()) {
          this.closeAddModal();
          this.showSuccess('Deliverable saved successfully.');
        }
      }
    }, 100);
  }

  openReportModal(id: string): void {
    this.selectedDeliverableId = id;
    this.newReport = {
      year: new Date().getFullYear(),
      quarter: 'Q1',
      targetValue: undefined,
      actualValue: undefined,
      progress: '',
      keyIssues: '',
      mdaEfforts: '',
      comments: ''
    };
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.store.clearError();
  }

  submitReport(): void {
    if (this.newReport.targetValue === undefined || this.newReport.actualValue === undefined) {
      alert('Please fill in required Target and Actual values.');
      return;
    }

    const d = this.store.deliverables().find(x => x.id === this.selectedDeliverableId);
    if (!d) {
      alert('Selected deliverable not found.');
      return;
    }

    // Deep copy existing performance
    const currentPerformance = JSON.parse(JSON.stringify(d.yearlyPerformance || {}));
    const yKey = String(this.newReport.year);
    const qKey = String(this.newReport.quarter).toLowerCase();

    if (!currentPerformance[yKey]) {
      currentPerformance[yKey] = {};
    }
    currentPerformance[yKey][qKey] = {
      target: Number(this.newReport.targetValue),
      actual: Number(this.newReport.actualValue)
    };

    // Call store update rxMethod with the full yearlyPerformance object
    this.store.updateDeliverable({
      id: this.selectedDeliverableId,
      dto: { yearlyPerformance: currentPerformance }
    });

    const interval = setInterval(() => {
      if (!this.store.loading()) {
        clearInterval(interval);
        if (!this.store.error()) {
          this.closeReportModal();
          this.showSuccess('Report submitted successfully.');
        }
      }
    }, 100);
  }

  openAddAreaModal(): void {
    this.newAreaName = '';
    this.showAddAreaModal = true;
  }

  closeAddAreaModal(): void {
    this.showAddAreaModal = false;
    this.store.clearError();
  }

  submitAddArea(): void {
    if (!this.newAreaName.trim()) {
      alert('Please enter a valid Priority Area name.');
      return;
    }

    // Call store rxMethod to save
    this.store.createPriorityArea(this.newAreaName.trim());

    // Watch loading and error states to close modal on success
    const interval = setInterval(() => {
      if (!this.store.loading()) {
        clearInterval(interval);
        if (!this.store.error()) {
          this.closeAddAreaModal();
          this.showSuccess('Priority Area created successfully.');
        }
      }
    }, 100);
  }
}
