import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationStore } from '../../store/organization.store';
import {
  CreateDepartmentPayload,
  CreateOrganizationPayload
} from '../../services/organization.service';

@Component({
  selector: 'app-organization-dashboard',
  standalone: false,
  templateUrl: './organization-dashboard.html',
  styleUrl: './organization-dashboard.css',
})
export class OrganizationDashboard implements OnInit {
  store = inject(OrganizationStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  searchText = '';

  // Modals visibility state
  showAgencyModal = false;
  showDeptModal = false;

  // Edit Modes
  isEditingAgency = false;
  isEditingDept = false;

  // Form Models
  agencyForm: CreateOrganizationPayload = {
    code: '',
    name: '',
    motto: '',
    logo: '',
    isActive: true
  };

  deptForm: CreateDepartmentPayload = {
    code: '',
    name: '',
    description: '',
    head: '',
    directorEmail: '',
    contactPhone: '',
    organizationCode: ''
  };

  editingDeptId = '';

  showSuccessModal = false;
  successMessage = '';

  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => {
      this.showSuccessModal = false;
    }, 5000);
  }

  // Computeds
  filteredAgencies = computed(() => {
    const list = this.store.agencies();
    const query = this.store.searchQuery().toLowerCase();
    if (!query) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.code.toLowerCase().includes(query) ||
        (a.motto && a.motto.toLowerCase().includes(query))
    );
  });

  filteredDepartments = computed(() => {
    const list = this.store.departments();
    const query = this.store.searchQuery().toLowerCase();
    if (!query) return list;
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.code.toLowerCase().includes(query) ||
        d.head.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.store.loadAgencies();
    this.store.loadDepartments();
  }

  setTab(tab: 'agencies' | 'departments'): void {
    this.store.setActiveTab(tab);
  }

  onSearch(): void {
    this.store.setSearchQuery(this.searchText);
  }

  // Agency Modals / Form actions
  openAddAgency(): void {
    this.isEditingAgency = false;
    this.agencyForm = {
      code: '',
      name: '',
      motto: '',
      logo: '',
      isActive: true
    };
    this.showAgencyModal = true;
  }

  openEditAgency(agency: any): void {
    this.isEditingAgency = true;
    this.agencyForm = {
      code: agency.code,
      name: agency.name,
      motto: agency.motto || '',
      logo: agency.logo || '',
      isActive: agency.isActive
    };
    this.showAgencyModal = true;
  }

  closeAgencyModal(): void {
    this.showAgencyModal = false;
  }

  submitAgencyForm(): void {
    if (!this.agencyForm.code || !this.agencyForm.name) {
      return;
    }
    if (this.isEditingAgency) {
      this.store.updateAgency({
        code: this.agencyForm.code,
        payload: {
          name: this.agencyForm.name,
          motto: this.agencyForm.motto,
          logo: this.agencyForm.logo,
          isActive: this.agencyForm.isActive
        },
        successCb: () => {
          this.closeAgencyModal();
          this.showSuccess('Agency saved successfully.');
        }
      });
    } else {
      this.store.createAgency({
        payload: this.agencyForm,
        successCb: () => {
          this.closeAgencyModal();
          this.showSuccess('Agency created successfully.');
        }
      });
    }
  }

  // Department Modals / Form actions
  openAddDept(): void {
    this.isEditingDept = false;
    this.deptForm = {
      code: '',
      name: '',
      description: '',
      head: '',
      directorEmail: '',
      contactPhone: '',
      organizationCode: this.store.agencies()[0]?.code || ''
    };
    this.showDeptModal = true;
  }

  /** Opens the department's page listing every deliverable assigned to it. */
  openDepartment(dept: { code: string }): void {
    this.router.navigate(['departments', dept.code], { relativeTo: this.route });
  }

  openEditDept(dept: any): void {
    this.isEditingDept = true;
    this.editingDeptId = dept.id;
    this.deptForm = {
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      head: dept.head,
      directorEmail: dept.directorEmail || '',
      contactPhone: dept.contactPhone || '',
      organizationCode: dept.organization?.code || this.store.agencies()[0]?.code || ''
    };
    this.showDeptModal = true;
  }

  closeDeptModal(): void {
    this.showDeptModal = false;
  }

  submitDeptForm(): void {
    if (!this.deptForm.code || !this.deptForm.name || !this.deptForm.head || !this.deptForm.organizationCode) {
      return;
    }

    // Build a clean payload — strip empty strings from optional fields
    // so backend validators (@IsEmail, @Matches) don't reject them
    const cleanPayload: any = {
      code: this.deptForm.code,
      name: this.deptForm.name,
      head: this.deptForm.head,
      organizationCode: this.deptForm.organizationCode,
    };
    if (this.deptForm.description && this.deptForm.description.trim()) {
      cleanPayload.description = this.deptForm.description.trim();
    }
    if (this.deptForm.directorEmail && this.deptForm.directorEmail.trim()) {
      cleanPayload.directorEmail = this.deptForm.directorEmail.trim();
    }
    if (this.deptForm.contactPhone && this.deptForm.contactPhone.trim()) {
      cleanPayload.contactPhone = this.deptForm.contactPhone.trim();
    }

    if (this.isEditingDept) {
      this.store.updateDepartment({
        id: this.editingDeptId,
        payload: cleanPayload,
        successCb: () => {
          this.closeDeptModal();
          this.showSuccess('Department saved successfully.');
        }
      });
    } else {
      this.store.createDepartment({
        payload: cleanPayload,
        successCb: () => {
          this.closeDeptModal();
          this.showSuccess('Department created successfully.');
        }
      });
    }
  }
}
