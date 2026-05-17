import { Component, OnInit, inject, computed } from '@angular/core';
import { AgencyDeliverablesStore } from '../../store/agency-deliverables.store';
import { AgencyDeliverable, AgencyDeliverablesService } from '../../services/agency-deliverables.service';

@Component({
  selector: 'app-agency-deliverables-list',
  standalone: false,
  templateUrl: './agency-deliverables-list.html',
  styleUrl: './agency-deliverables-list.css',
})
export class AgencyDeliverablesList implements OnInit {
  store = inject(AgencyDeliverablesStore);
  agencyService = inject(AgencyDeliverablesService);

  searchAgency = '';
  searchDepartment = '';
  expandedId: string | null = null;
  priorityAreas: { id: string; name: string }[] = [];

  // Add modal state variables
  showAddModal = false;
  newDeliverable: Partial<AgencyDeliverable> = this.getEmptyForm();

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

  filteredDeliverables = computed(() => {
    const all = this.store.deliverables();
    const agency = this.store.filterAgency().toLowerCase();
    const dept = this.store.filterDepartment().toLowerCase();
    return all.filter(d => {
      // `ministry` field holds the agency name in NIMASA's data model
      const matchAgency = !agency || d.ministry.toLowerCase().includes(agency);
      const matchDept = !dept || d.responsibleDepartment.toLowerCase().includes(dept);
      return matchAgency && matchDept;
    });
  });

  uniqueAgencies = computed(() => {
    const all = this.store.deliverables();
    return [...new Set(all.map(d => d.ministry))].sort();
  });

  ngOnInit(): void {
    this.store.loadDeliverables();
    this.store.loadSummary();
    this.store.loadDepartments();
    this.agencyService.getPriorityAreas().subscribe({
      next: (areas) => this.priorityAreas = areas,
      error: () => {}
    });
  }

  applyAgencyFilter(): void {
    this.store.setFilterAgency(this.searchAgency);
  }

  onDepartmentChange(name: string): void {
    this.searchDepartment = name;
    this.store.setFilterDepartment(name);
  }

  clearFilters(): void {
    this.searchAgency = '';
    this.searchDepartment = '';
    this.store.setFilterAgency('');
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

  getEmptyForm(): Partial<AgencyDeliverable> {
    return {
      serialNumber: this.store.deliverables().length + 1,
      ministry: 'NIMASA',
      priorityArea: '',
      outcome: '',
      deliverable: '',
      baselineType: 'Percentage',
      indicator: '',
      baseline2023: undefined,
      responsibleDepartment: '',
      supportingEvidence: '',
      category: 'AGENCY'
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

    if (this.newDeliverable.serialNumber) {
      this.newDeliverable.serialNumber = Number(this.newDeliverable.serialNumber);
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

    const payload = {
      ...this.newReport,
      year: Number(this.newReport.year),
      targetValue: Number(this.newReport.targetValue),
      actualValue: Number(this.newReport.actualValue)
    };

    this.store.createSubmission({
      id: this.selectedDeliverableId,
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
