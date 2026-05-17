import { Component, OnInit, inject, computed } from '@angular/core';
import { PresidentialPrioritiesStore } from '../../store/presidential-priorities.store';
import { PresidentialPriority } from '../../services/presidential-priorities.service';

@Component({
  selector: 'app-presidential-priorities-list',
  standalone: false,
  templateUrl: './presidential-priorities-list.html',
  styleUrl: './presidential-priorities-list.css',
})
export class PresidentialPrioritiesList implements OnInit {
  store = inject(PresidentialPrioritiesStore);

  searchMinistry = '';
  searchPriorityArea = '';
  searchDepartment = '';
  expandedId: string | null = null;

  // Add modal state variables
  showAddModal = false;
  showAddAreaModal = false;
  newAreaName = '';
  newPriority: Partial<PresidentialPriority> = this.getEmptyForm();

  // Quarterly Report Modal State
  showReportModal = false;
  selectedPriorityId = '';
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

  filteredPriorities = computed(() => {
    const all = this.store.priorities();
    const min = this.store.filterMinistry().toLowerCase();
    const area = this.store.filterPriorityArea().toLowerCase();
    const dept = this.store.filterDepartment().toLowerCase();
    return all.filter(p => {
      const matchMin = !min || p.ministry.toLowerCase().includes(min);
      const matchArea = !area || p.priorityArea.toLowerCase().includes(area);
      const matchDept = !dept || p.responsibleDepartment.toLowerCase().includes(dept);
      return matchMin && matchArea && matchDept;
    });
  });

  uniqueMinistries = computed(() => {
    return [...new Set(this.store.priorities().map(p => p.ministry))].sort();
  });

  hasActiveFilter = computed(() =>
    !!this.store.filterMinistry() || !!this.store.filterPriorityArea() || !!this.store.filterDepartment()
  );

  ngOnInit(): void {
    this.store.loadPriorities();
    this.store.loadPriorityAreas();
    this.store.loadDepartments();
  }

  applyMinistryFilter(): void {
    this.store.setFilterMinistry(this.searchMinistry);
  }

  onPriorityAreaChange(area: string): void {
    this.searchPriorityArea = area;
    this.store.setFilterPriorityArea(area);
  }

  onDepartmentChange(name: string): void {
    this.searchDepartment = name;
    this.store.setFilterDepartment(name);
  }

  clearFilters(): void {
    this.searchMinistry = '';
    this.searchPriorityArea = '';
    this.searchDepartment = '';
    this.store.setFilterMinistry('');
    this.store.setFilterPriorityArea('');
    this.store.setFilterDepartment('');
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getStatusClass(actual: number, target: number): string {
    if (!target) return 'status-na';
    const pct = (actual / target) * 100;
    if (pct >= 90) return 'status-on-track';
    if (pct >= 60) return 'status-at-risk';
    return 'status-off-track';
  }

  getStatusLabel(actual: number, target: number): string {
    if (!target) return 'N/A';
    const pct = (actual / target) * 100;
    if (pct >= 90) return 'On Track';
    if (pct >= 60) return 'At Risk';
    return 'Off Track';
  }

  getEmptyForm(): Partial<PresidentialPriority> {
    return {
      serialNumber: this.store.priorities().length + 1,
      ministry: 'NIMASA',
      priorityArea: '',
      outcome: '',
      deliverable: '',
      baselineType: 'Percentage',
      indicator: '',
      baseline2023: undefined,
      responsibleDepartment: '',
      supportingEvidence: '',
      category: 'PRESIDENTIAL_PRIORITY'
    };
  }

  openAddModal(): void {
    this.newPriority = this.getEmptyForm();
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.store.clearError();
  }

  submitAdd(): void {
    if (!this.newPriority.priorityArea || !this.newPriority.deliverable || !this.newPriority.indicator) {
      alert('Please fill in all required fields (Priority Area, Deliverable, and KPI/Indicator).');
      return;
    }
    // Convert serialNumber to number
    if (this.newPriority.serialNumber) {
      this.newPriority.serialNumber = Number(this.newPriority.serialNumber);
    }
    if (this.newPriority.baseline2023) {
      this.newPriority.baseline2023 = Number(this.newPriority.baseline2023);
    }

    // Call store rxMethod to save
    this.store.createPriority(this.newPriority);

    // Watch loading and error states to close modal on success
    const interval = setInterval(() => {
      if (!this.store.loading()) {
        clearInterval(interval);
        if (!this.store.error()) {
          this.closeAddModal();
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
        }
      }
    }, 100);
  }

  openReportModal(id: string): void {
    this.selectedPriorityId = id;
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

    const payload = {
      ...this.newReport,
      year: Number(this.newReport.year),
      targetValue: Number(this.newReport.targetValue),
      actualValue: Number(this.newReport.actualValue)
    };

    this.store.createSubmission({
      id: this.selectedPriorityId,
      submission: payload
    });

    const interval = setInterval(() => {
      if (!this.store.loading()) {
        clearInterval(interval);
        if (!this.store.error()) {
          this.closeReportModal();
        }
      }
    }, 100);
  }
}
