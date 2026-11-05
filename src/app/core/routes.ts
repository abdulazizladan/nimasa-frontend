/**
 * Every app URL in one place. Components navigate with these instead of string literals, so a
 * route can move without a search through the templates.
 */
export const ROUTES = {
  home: '/',
  login: '/auth/login',
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    addUser: '/admin/users/add',
    user: (email: string) => `/admin/users/${email}`,
    organization: '/admin/organization',
    department: (code: string) => `/admin/organization/departments/${code}`,
    presidential: '/admin/priorities',
    ministerial: '/admin/deliverables',
    agency: '/admin/agency-deliverables',
    settings: '/admin/settings',
  },
  guest: {
    root: '/guest',
    dashboard: '/guest/dashboard',
    kpis: '/guest/kpis',
    kpi: (id: string) => `/guest/kpis/${id}`,
    reports: '/guest/reports',
  },
} as const;
