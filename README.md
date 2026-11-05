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

Components that call the API are tested with `provideHttpClient()` and `provideHttpClientTesting()`; see `users/guest/guest-dashboard/guest-dashboard.spec.ts` for an example. The form rules behind the deliverable and quarterly report forms are plain functions in `strategic-deliverables/utils/deliverable-form.ts` and `report-form.ts`, each with its own spec.

## Users and access

There are two roles, set on each user by an admin:

| Role | Lands on | Can do |
|---|---|---|
| `admin` | `/admin` | Everything: manage users, organization, deliverables and quarterly reports |
| `guest` | `/guest` | Read-only: the dashboard, every KPI with its targets and actuals, and PDF reports |

Log in at `/auth/login`. The JWT is kept in `localStorage` and attached to every API request by `core/interceptors/jwt.interceptor.ts` (`auth/services/auth.service.ts` owns the session). The route guards check the token's expiry on every navigation, and a 401 from the API ends the session; both return to the login page. Logging out asks for confirmation.

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
| `/guest/dashboard` | Guest dashboard (read-only overview) | `users/guest/guest-dashboard` |
| `/guest/kpis` | Every KPI for the period, searchable and filterable | `users/guest/guest-kpis` |
| `/guest/kpis/:id` | One KPI: targets and actuals over the quarters, notes, PDF | `users/guest/guest-kpi` |
| `/guest/reports` | Download a PDF report (period summary or single KPI) | `users/guest/guest-reports` |

The year and the period within it (full year, or Q1–Q4) are shared app-wide as signals in `core/services/global-state.service.ts`. Every year picker is `core/components/year-select` (or `period-picker`, which adds the quarter); both offer the years from `core/years.ts` plus any year found in the data. URLs are listed once in `core/routes.ts`.

### Shared building blocks (`src/app/core`)

| What | Where |
|---|---|
| Portal shell: top bar, side navigation (bottom tabs on phones), toasts, logout confirmation | `components/portal-layout`, used by the admin and guest layouts with their own nav items |
| Modal dialog with focus trapping and Escape | `components/modal` |
| "Are you sure?" dialog | `components/confirm-dialog` |
| Toasts ("Saved.") | `services/toast.service.ts` + `components/toasts` |
| Icons (inline SVG, Heroicons outline) | `components/icon`, `<app-icon name="pencil" />` |
| Departments cache shared by every page | `services/reference-data.service.ts` |
| API helpers: list unwrapping, readable error messages | `api.ts` |

## How deliverables work

### One feature, three pages

Presidential, ministerial and agency deliverables all use the same components in `src/app/strategic-deliverables`. Each page's module only supplies a configuration from `strategic-deliverables/deliverables-config.ts`:

- the API path and page URL
- labels (title, badge, form titles)
- which categories it shows: Presidential (and "Ministerial and Presidential"), Ministerial (and "Ministerial and Presidential"), or Agency
- whether deliverables have a ministry (agency ones don't), and whether "Organization-wide" is an owner choice (agency only)
- which priority-area list it uses (see below)

`deliverablesRoutes(config)` in `strategic-deliverables-shared-module.ts` gives each page its own service and store, so the pages never share data by accident; the three lazy page modules are defined at the bottom of that file. To change something on all three pages, change it once in `strategic-deliverables`.

The list page (`components/deliverables-list`) renders the cards and composes three child components: `deliverable-form` (create/edit), `quarterly-report-form` and `priority-areas-tab`. The store loads each page's lists once and keeps them while you navigate; saving a report refreshes only that deliverable.

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
- **Annual figure**: how the quarters' actuals combine into the year's actual (sum, average or latest quarter).
- **Performance direction**: "higher is better", or "lower is better" for things like piracy incidents.

A deliverable shows on a page for a year when that is its report year, it has an annual target for that year, or it has a report in that year.

Status rules live in `strategic-deliverables/utils/kpi-performance.ts` (`assess`) and are covered by `kpi-performance.spec.ts`:

| Actual against target | Higher is better | Lower is better |
|---|---|---|
| Better than target | **Target Surpassed** (e.g. 50 against 40 → "+10 above target") | **Target Surpassed** (e.g. 1 against 2 → "1 below target") |
| Exactly on target | **Target Met** | **Target Met** |
| Short of target | **On Track** (≥ 90% of target), **At Risk** (≥ 60%), **Off Track** | **Missed – Minor / Moderate / Severe**, graded by the excess against the gap between baseline and target |
| No actual or no target | N/A | N/A |

A target of 0 works in both directions: for "higher is better", any actual of 0 or more is met or surpassed.

The dashboards group these into four classes (`strategic-deliverables/utils/portfolio-summary.ts`): surpassed/met/on track, at risk/minor miss, off track/missed, and no data / not scored.

### Serial numbers

Serial numbers are assigned by the backend when a deliverable is created and can't be edited. They're unique within each page; "Ministerial and Presidential" deliverables get a number that is free on both pages.

## Styling

All colours, sizes, radii and shadows are design tokens in `src/styles/tokens.css`; `src/styles/base.css` holds the reset and base typography (Montserrat headings, Open Sans body, loaded once from `index.html`), and `src/styles/components.css` holds everything two or more components share: page headers, buttons (`.btn .btn-primary|secondary|ghost|danger`), cards, status badges (`.badge .status-*`), tables (`.table-wrap .table`), form fields, alerts, empty states, modals and toasts. Component stylesheets only hold what is specific to that component and read the tokens.

Interactive elements use `--accent` (a darker brand blue that passes contrast as text); the bright brand blue is reserved for strips and active borders. One `--status-*` palette colours badges, progress bars, chart fills and the PDF. There is no CSS framework.

## Dashboards

The admin and guest dashboards share `strategic-deliverables/components/deliverables-overview`. They are about KPIs, not priority areas: the centrepiece is the **Target vs actual** list, every KPI's actual against its target for the period, worst first. At the top, the **period** (full year or Q1–Q4) and Type and Department filters apply to every panel. For a quarter, each KPI is scored on that quarter's actual against that quarter's target. **Download PDF report** saves the view as a PDF; **CSV** saves the figures; **Refresh** fetches the latest data (the lists are otherwise loaded once per session and shared by every page through `services/all-deliverables.service.ts`).

| Panel | Shows |
|---|---|
| Ready to score (admins only) | What stops deliverables getting a status: no annual target, direction never set, no report this year, owner that isn't a department. Each line opens to list the deliverables. |
| Headline tiles | Per page: share surpassed, met or on track, the surpassed / met / on track split, and the change since the previous period |
| Target vs actual | Every KPI for the period, worst first: status, target, actual and a sparkline of each quarter's actual against its target. Status chips (All, Needs attention, and the four status classes) and a search box filter the list; it shows 10 KPIs until "Show all". |
| Status by type | Stacked bars per page, with a table view |
| Quarterly reporting | Share of KPIs reported for each quarter |
| Overdue reports (admins only) | Who still owes a report for the latest quarter that has ended |
| Status by department | Stacked bars per owner |
| Trend by quarter | Share surpassed, met or on track per quarter; appears once two quarters have scored reports |

The overview takes `audience="admin"` (the default) or `audience="guest"`. Admins' links open the admin pages; guests' links open the guest KPI pages, already filtered (a tile by type, a department by owner) or the KPI itself.

The top cards on the admin dashboard count the deliverables active in the selected year, with the all-time total underneath, so they agree with the panels below.

### KPI line chart

`strategic-deliverables/components/kpi-quarter-chart` draws one KPI's quarterly actuals (blue) against its quarterly targets (grey), from its first report to its latest, across years. A quarter without a report leaves a gap. It appears on the guest KPI page, in the expanded card on the admin deliverables pages, and in the KPI PDF. The geometry lives in `utils/kpi-timeline.ts`, so the screen and the PDF draw the same lines.

### PDF reports

`strategic-deliverables/services/pdf-report.service.ts` builds A4 PDFs in the browser with [pdfmake](https://pdfmake.github.io/docs/), loaded only when someone downloads a report (about 1 MB; text is set in Helvetica, a standard PDF font, so no font files are downloaded):

- **Period summary:** headline figures, status by type, KPIs by status, and every KPI with target, actual and status, worst first.
- **Single KPI:** details, the line chart, each quarter's target, actual and status, and the report notes.

Guest reports and the guest KPI page leave out the "support required" note.

### Where the rules live

The rules behind these panels are plain functions in `strategic-deliverables/utils/portfolio-summary.ts` (periods, KPI filtering with `filterKpis`, worst-first ordering with `worstFirst`, readiness, overdue, grouping, trend, export), covered by `portfolio-summary.spec.ts`. The guest KPIs page uses the same two functions, so every KPI list filters and orders the same way. The charts are small standalone components: `status-bars`, `quarter-sparkline`, `status-trend` and `kpi-quarter-chart`.

## Conventions

- **Target and Actual.** A KPI's planned figure is always called its **Target** and its measured figure its **Actual**, in that order, on every page, chart, export and PDF. Don't introduce other words for them ("result", "achieved", "score").
- Visual style: see [styleguide.md](styleguide.md) for the brand, and `src/styles/tokens.css` for the values the app uses.
- The app runs without zone.js, so anything a template shows must be a signal, an input, or written from a template event. Writing a plain field inside an HTTP callback or a timer will not update the screen.
- Page components are declared in NgModules (`standalone: false`); shared building blocks (`core/components/*`, the charts, the forms under `strategic-deliverables/components`) are standalone and imported where needed.
- State uses NgRx Signal Store (`@ngrx/signals`); errors go through `apiErrorMessage()` so NestJS validation messages read well.
- New templates use the built-in control flow (`@if`, `@for ... track`).
