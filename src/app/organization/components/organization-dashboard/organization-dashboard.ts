import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationStore } from '../../store/organization.store';
import {
  CreateDepartmentPayload, CreateOrganizationPayload, Department, Organization
} from '../../services/organization.service';
import { ToastService } from '../../../core/services/toast.service';

const emptyAgency = (): CreateOrganizationPayload => ({ code: '', name: '', motto: '', logo: '', isActive: true });
const emptyDepartment = (organizationCode: string): CreateDepartmentPayload =>
  ({ code: '', name: '', description: '', head: '', directorEmail: '', contactPhone: '', organizationCode });

/** Agencies and departments: the agency card, a searchable department table, and the two edit forms. */
@Component({
  selector: 'app-organization-dashboard',
  standalone: false,
  templateUrl: './organization-dashboard.html',
  styleUrl: './organization-dashboard.css',
})
export class OrganizationDashboard implements OnInit {
  store = inject(OrganizationStore);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  searchText = signal('');

  /** Open agency form (null = closed) */
  agencyForm = signal<{ editing: boolean; form: CreateOrganizationPayload } | null>(null);
  /** Open department form (null = closed) */
  deptForm = signal<{ id: string | null; form: CreateDepartmentPayload } | null>(null);

  /** The one agency the system manages */
  agency = computed<Organization | null>(() => this.store.agencies()[0] ?? null);

  filteredDepartments = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const list = this.store.departments();
    if (!query) return list;
    return list.filter(d =>
      d.name.toLowerCase().includes(query) || d.code.toLowerCase().includes(query) || (d.head || '').toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.store.load();
  }

  /** Opens the department's page listing every deliverable assigned to it. */
  openDepartment(dept: Department): void {
    this.router.navigate(['departments', dept.code], { relativeTo: this.route });
  }

  trackDept(_: number, d: Department): string {
    return d.id;
  }

  // ── Agency form ──

  editAgency(agency: Organization): void {
    this.store.clearError();
    this.agencyForm.set({
      editing: true,
      form: { code: agency.code, name: agency.name, motto: agency.motto || '', logo: agency.logo || '', isActive: agency.isActive }
    });
  }

  addAgency(): void {
    this.store.clearError();
    this.agencyForm.set({ editing: false, form: emptyAgency() });
  }

  submitAgency(): void {
    const state = this.agencyForm();
    if (!state || !state.form.code || !state.form.name) return;
    const onSuccess = () => {
      this.agencyForm.set(null);
      this.toast.success(state.editing ? 'Agency saved.' : 'Agency created.');
    };
    if (state.editing) {
      const { code, ...payload } = state.form;
      this.store.updateAgency({ code, payload, onSuccess });
    } else {
      this.store.createAgency({ payload: state.form, onSuccess });
    }
  }

  // ── Department form ──

  addDepartment(): void {
    this.store.clearError();
    this.deptForm.set({ id: null, form: emptyDepartment(this.agency()?.code || '') });
  }

  editDepartment(dept: Department): void {
    this.store.clearError();
    this.deptForm.set({
      id: dept.id,
      form: {
        code: dept.code, name: dept.name, description: dept.description || '', head: dept.head,
        directorEmail: dept.directorEmail || '', contactPhone: dept.contactPhone || '',
        organizationCode: dept.organization?.code || this.agency()?.code || ''
      }
    });
  }

  submitDepartment(): void {
    const state = this.deptForm();
    if (!state) return;
    const f = state.form;
    if (!f.code || !f.name || !f.head || !f.organizationCode) return;

    // Optional fields are left out when blank so backend validators (@IsEmail, @Matches) don't reject them
    const payload: CreateDepartmentPayload = { code: f.code, name: f.name, head: f.head, organizationCode: f.organizationCode };
    if (f.description?.trim()) payload.description = f.description.trim();
    if (f.directorEmail?.trim()) payload.directorEmail = f.directorEmail.trim();
    if (f.contactPhone?.trim()) payload.contactPhone = f.contactPhone.trim();

    const onSuccess = () => {
      this.deptForm.set(null);
      this.toast.success(state.id ? 'Department saved.' : 'Department created.');
    };
    if (state.id) this.store.updateDepartment({ id: state.id, payload, onSuccess });
    else this.store.createDepartment({ payload, onSuccess });
  }

  closeForms(): void {
    this.agencyForm.set(null);
    this.deptForm.set(null);
    this.store.clearError();
  }
}
