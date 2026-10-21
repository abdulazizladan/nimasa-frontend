import { InjectionToken } from '@angular/core';

export type DeliverableCategory = 'PRESIDENTIAL_PRIORITY' | 'MINISTERIAL' | 'BOTH' | 'AGENCY';

/** What differs between the presidential priorities, ministerial deliverables and agency deliverables pages. */
export interface DeliverablesConfig {
  /** API path under environment.baseUrl */
  apiPath: string;
  /** Where this page lives in the admin app, for links from other pages */
  pagePath: string;
  /** Page title, e.g. "Presidential Priorities" */
  title: string;
  /** Small badge above the title */
  badge: string;
  subtitle: string;
  /** e.g. "Presidential Deliverable", used in form titles */
  singular: string;
  /** e.g. "presidential deliverables", used in sentences */
  plural: string;
  /** Shown only when there is more than one category option */
  categoryQuestion: string;
  categoryOptions: { value: DeliverableCategory; label: string }[];
  defaultCategory: DeliverableCategory;
  /** Whether deliverables belong to a ministry (shown on cards and details) */
  showMinistry: boolean;
  /** Ministry given to new deliverables */
  defaultMinistry: string;
  /** Label for the owner field in the form */
  departmentLabel: string;
  /** Extra owner choice for deliverables that belong to the whole organization rather than one department */
  organizationWide?: { value: string; label: string };
}

export const DELIVERABLES_CONFIG = new InjectionToken<DeliverablesConfig>('DELIVERABLES_CONFIG');

export const CATEGORY_LABELS: Record<DeliverableCategory, string> = {
  PRESIDENTIAL_PRIORITY: 'Presidential',
  MINISTERIAL: 'Ministerial',
  BOTH: 'Ministerial and Presidential',
  AGENCY: 'Agency'
};

export const PRESIDENTIAL_CONFIG: DeliverablesConfig = {
  apiPath: 'presidential-priorities',
  pagePath: '/admin/priorities',
  title: 'Presidential Priorities',
  badge: 'Presidential',
  subtitle: 'Strategic national priorities tracked across all ministries and agencies',
  singular: 'Presidential Deliverable',
  plural: 'presidential deliverables',
  categoryQuestion: 'Is this a Presidential or a Ministerial and Presidential Deliverable? *',
  categoryOptions: [
    { value: 'PRESIDENTIAL_PRIORITY', label: 'Presidential' },
    { value: 'BOTH', label: 'Ministerial and Presidential Deliverable' }
  ],
  defaultCategory: 'PRESIDENTIAL_PRIORITY',
  showMinistry: true,
  defaultMinistry: 'NIMASA',
  departmentLabel: 'Responsible NIMASA Department *'
};

export const MINISTERIAL_CONFIG: DeliverablesConfig = {
  apiPath: 'ministerial-deliverables/deliverables',
  pagePath: '/admin/deliverables',
  title: 'Ministerial Deliverables',
  badge: 'Ministerial',
  subtitle: 'Performance bond KPIs tracked across all priority areas',
  singular: 'Ministerial Deliverable',
  plural: 'ministerial deliverables',
  categoryQuestion: 'Is this a Ministerial or a Ministerial and Presidential Deliverable? *',
  categoryOptions: [
    { value: 'MINISTERIAL', label: 'Ministerial' },
    { value: 'BOTH', label: 'Ministerial and Presidential Deliverable' }
  ],
  defaultCategory: 'MINISTERIAL',
  showMinistry: true,
  defaultMinistry: 'NIMASA',
  departmentLabel: 'Responsible NIMASA Department *'
};

export const AGENCY_CONFIG: DeliverablesConfig = {
  apiPath: 'agency-deliverables',
  pagePath: '/admin/agency-deliverables',
  title: 'Agency Deliverables',
  badge: 'Agency',
  subtitle: 'Deliverables owned by NIMASA departments or by the organization as a whole',
  singular: 'Agency Deliverable',
  plural: 'agency deliverables',
  categoryQuestion: '',
  categoryOptions: [{ value: 'AGENCY', label: 'Agency' }],
  defaultCategory: 'AGENCY',
  // Agency deliverables have no ministry; any value already stored is kept but not shown
  showMinistry: false,
  defaultMinistry: '',
  departmentLabel: 'Responsible Department / Owner *',
  // "NIMASA" is the value existing records already use for organization-wide deliverables
  organizationWide: { value: 'NIMASA', label: 'Organization-wide (NIMASA)' }
};
