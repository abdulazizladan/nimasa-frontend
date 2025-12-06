# NIMASA CDCU Management System

A comprehensive organizational management application for the Nigerian Maritime Administration and Safety Agency (NIMASA) Corporate Development and Coordination Unit (CDCU). This Angular-based web application provides tools for managing departments, users, projects, and organizational performance tracking.

## Overview

The NIMASA CDCU Management System is designed to streamline organizational operations by providing:

- **Department Management**: Track department structure, performance metrics, KPIs, and strategic alignment
- **Organization Management**: View and manage organizational hierarchy and structure
- **User Management**: Role-based access control with admin, director, and guest user types
- **Project Management**: Monitor and track organizational projects and initiatives
- **Performance Visualization**: Interactive dashboards with charts and infographics for performance analysis
- **Strategic Alignment**: Track alignment with NIMASA strategic pillars and maritime domains

## Technology Stack

- **Framework**: Angular 20.0.0
- **UI Components**: Angular Material 20.2.7
- **State Management**: NgRx Signals 20.0.1
- **Charts**: ng2-charts 8.0.0
- **Authentication**: JWT-based authentication with jwt-decode 4.0.0
- **Styling**: Angular Flex Layout 15.0.0-beta.42

## Features

### Department Management
- View department details including director information, staff count, and organizational units
- Track department performance scores and KPIs
- Monitor targets (completed, pending, overdue)
- Visualize department performance trends across fiscal periods
- Filter departments by status, performance, maritime domain, and strategic pillars

### Organization Management
- Hierarchical department structure visualization
- Organization-wide performance metrics
- Budget allocation and spending tracking
- Strategic pillar alignment

### User Management
- Role-based access control (Admin, Director, Guest)
- User authentication and authorization
- Profile management

### Performance Analytics
- Interactive dashboards with real-time data
- Performance rating visualizations
- Monthly performance trend analysis
- Comparative metrics (month-over-month)

## Development Setup

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- Angular CLI 20.0.5

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nimasa/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
   - Update `src/environment/environment.ts` with your backend API URL
   - Default backend: `https://nimasa-backend.onrender.com/`

### Development Server

Start the local development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you modify source files.

## Building

### Development Build

```bash
ng build
```

### Production Build

```bash
ng build --configuration production
```

Build artifacts will be stored in the `dist/` directory.

## Deployment

### Firebase Hosting

Deploy to Firebase hosting:

```bash
firebase deploy --only hosting:nimasa-app
```

Ensure your `firebase.json` is configured correctly:

```json
{
  "hosting": {
    "public": "dist/nimasa/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Testing

### Unit Tests

Execute unit tests via Karma:

```bash
ng test
```

### End-to-End Tests

```bash
ng e2e
```

Note: You may need to configure an e2e testing framework (e.g., Cypress, Playwright) as Angular CLI doesn't include one by default.

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin-specific components and services
│   ├── auth/               # Authentication module
│   ├── features/
│   │   ├── departments-management/    # Department CRUD and visualization
│   │   ├── organization-management/   # Organization structure management
│   │   ├── projects-management/       # Project tracking
│   │   └── users-management/          # User administration
│   └── users/              # User role-based layouts (admin, guest)
├── environment/            # Environment configuration
└── assets/                 # Static assets
```

## Code Scaffolding

Generate new components:

```bash
ng generate component component-name
```

For a complete list of available schematics:

```bash
ng generate --help
```

## Contributing

1. Follow Angular style guide and best practices
2. Use TypeScript strict mode
3. Write unit tests for new features
4. Format code with Prettier (configured for Angular templates)
5. Ensure all builds pass before committing

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Angular Material Components](https://material.angular.io/)
- [NgRx Signals Documentation](https://ngrx.io/guide/signals)
- [NIMASA Official Website](https://nimasa.gov.ng/)

## License

Copyright © 2024 NIMASA. All rights reserved.
