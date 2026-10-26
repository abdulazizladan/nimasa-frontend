# NIMASA Performance Monitoring System — Frontend

Angular 21 web app for tracking NIMASA's presidential priorities, ministerial deliverables and agency deliverables: annual targets, quarterly reports, status against target, and dashboards for admins and guests.

The API lives in the sibling `../backend` folder (NestJS + SQLite).

## Running locally

You need Node.js and npm. Run the backend and the frontend side by side:

```bash
# 1. Backend (http://127.0.0.1:3000); needs JWT_SECRET in backend/.env (see backend/.env.example)
cd ../backend
npm install
npm run start:dev

# 2. Frontend (http://localhost:4200)
cd ../frontend
npm install
npm start
```

`npm start` (`ng serve`) uses the development configuration, which points at the local backend. The page reloads when you change a source file.

### Environments

| File | Used by | API base URL |
|---|---|---|
| `src/environments/environment.development.ts` | `ng serve`, `npm run watch` | `http://127.0.0.1:3000` |
| `src/environments/environment.ts` | `ng build` (production) | `https://nimasa-backend.onrender.com` |

## Building and deploying

```bash
npm run build          # production build into dist/nimasa/browser
firebase deploy        # Firebase Hosting, project "nimasa-pms" (see firebase.json)
```

Firebase rewrites every path to `index.html`, so deep links such as `/admin/priorities` work after a refresh.

Deploy the backend together with the frontend when a change touches both.

## Tests

```bash
npm test               # all unit tests (Vitest, jsdom)
npx ng test --watch=false --include src/app/strategic-deliverables/utils/kpi-performance.spec.ts   # one file
```

Components that call the API are tested with `provideHttpClient()` and `provideHttpClientTesting()`; see `users/guest/guest-dashboard/guest-dashboard.spec.ts` for an example.

## Users and access

There are two roles, set on each user by an admin:

| Role | Lands on | Can do |
|---|---|---|
| `admin` | `/admin` | Everything: manage users, organization, deliverables and quarterly reports |
| `guest` | `/guest` | View the guest dashboard (read-only) |

Log in at `/auth/login`. The JWT is kept in `localStorage` and attached to every API request by `core/interceptors/jwt.interceptor.ts`. Expired sessions are sent back to the login page. Logging out asks for confirmation.

The backend enforces the same rules: reading needs a login, and changes need the admin role.

## What's where

| URL | Page | Code |
|---|---|---|
| `/` | Public homepage | `pages/homepage` |
| `/auth/login` | Login | `auth` |
| `/admin/dashboard` | Admin dashboard: counts and the deliverables overview | `users/admin/components/dashboard` |
| `/admin/priorities` | Presidential Priorities | `presidential-priorities` → `strategic-deliverables` |
| `/admin/deliverables` | Ministerial Deliverables | `ministerial-deliverables` → `strategic-deliverables` |
| `/admin/agency-deliverables` | Agency Deliverables | `agency-performance` → `strategic-deliverables` |
| `/admin/<page>/:id/reports/:year/:quarter` | One quarterly report (any of the three pages above) | `strategic-deliverables/components/quarterly-report-detail` |
| `/admin/organization` | Agencies and departments | `organization` |
| `/admin/organization/departments/:code` | One department and the deliverables assigned to it | `organization/components/department-detail` |
| `/admin/users` | User management | `modules/users-management` |
| `/admin/settings` | Settings | `users/admin/components/settings` |
| `/guest/dashboard` | Guest dashboard (read-only overview) | `users/guest` |

The year selected on any page is shared app-wide through `core/services/global-state.service.ts`.

## How deliverables work

### One feature, three pages

Presidential, ministerial and agency deliverables all use the same components in `src/app/strategic-deliverables`. Each page's module only supplies a configuration from `strategic-deliverables/deliverables-config.ts`:

- the API path and page URL
- labels (title, badge, form titles)
- which categories it shows: Presidential (and "Ministerial and Presidential"), Ministerial (and "Ministerial and Presidential"), or Agency
- whether deliverables have a ministry (agency ones don't), and whether "Organization-wide" is an owner choice (agency only)
- which priority-area list it uses (see below)

`deliverablesRoutes(config)` in `strategic-deliverables-shared-module.ts` gives each page its own service and store, so the pages never share data by accident. To change something on all three pages, change it once in `strategic-deliverables`.

A deliverable marked **Ministerial and Presidential** appears on both of those pages.

### Priority areas

There are two separate priority-area lists:

| List (`priorityAreaScope`) | Used by |
|---|---|
| `national` | Presidential Priorities and Ministerial Deliverables |
| `agency` | Agency Deliverables |

Each page shows, and adds to, only its own list. A name only needs to be unique within its list, so the same area can exist in both. The API takes the list as `?scope=` when reading and `scope` in the body when creating; without it, the national list is used.

### Targets, reports and status

Each deliverable has:

- **Annual targets**, each with a baseline year and value, and a target year and value.
- **Quarterly reports** (Q1–Q4) with a target, an actual and written notes. Choosing a year and quarter in the report form loads that period's saved report, if there is one.
- **Annual figure**: how the quarters combine into the year's result (sum, average or latest quarter).
- **Performance direction**: "higher is better", or "lower is better" for things like piracy incidents.

A deliverable shows on a page for a year when that is its report year, it has an annual target for that year, or it has a report in that year.

Status rules live in `strategic-deliverables/utils/kpi-performance.ts` (`assess`) and are covered by `kpi-performance.spec.ts`:

| Result | Higher is better | Lower is better |
|---|---|---|
| Better than target | **Target Surpassed** (e.g. 50 against 40 → "+10 above target") | **Target Surpassed** (e.g. 1 against 2 → "1 below target") |
| Exactly on target | **Target Met** | **Target Met** |
| Short of target | **On Track** (≥ 90% of target), **At Risk** (≥ 60%), **Off Track** | **Missed – Minor / Moderate / Severe**, graded by the excess against the gap between baseline and target |
| No actual or no target | N/A | N/A |

A target of 0 works in both directions: for "higher is better", any result of 0 or more is met or surpassed.

The dashboards group these into four classes (`strategic-deliverables/utils/portfolio-summary.ts`): surpassed/met/on track, at risk/minor miss, off track/missed, and no data / not scored.

### Serial numbers

Serial numbers are assigned by the backend when a deliverable is created and can't be edited. They're unique within each page; "Ministerial and Presidential" deliverables get a number that is free on both pages.

## Dashboards

The admin and guest dashboards share `strategic-deliverables/components/deliverables-overview`:

- headline tiles per page (share of deliverables surpassed, met or on track)
- status by type, as stacked bars with a table view
- quarterly reporting completeness (share of deliverables reported per quarter)
- a "needs attention" list, worst first

On the guest dashboard it runs with `[linkToPages]="false"`, so nothing links to the admin pages.

## Conventions

- Visual style: see [styleguide.md](styleguide.md).
- Components are declared in NgModules (`standalone: false`), except shared building blocks such as `deliverables-overview` and `core/components/confirm-dialog`, which are standalone and imported where needed.
- State uses NgRx Signal Store (`@ngrx/signals`).
