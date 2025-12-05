import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrganizationStore } from '../../store/organization.store';

// Placeholder Interfaces
interface DepartmentMetrics {
  achievedGoals: number;
  notAchievedGoals: number;
  inProgressGoals: number;
  notDoneGoals: number;
}

interface Department {
  name: string;
  code: string;
  description: string;
  head: string;
  contactPhone: string;
  directorEmail: string;
  metrics: DepartmentMetrics;
}

interface Task {
  name: string;
  assignedTo: string;
  status: 'completed' | 'not achieved' | 'in progress' | 'not done';
}

@Component({
  selector: 'app-department-details',
  standalone: false,
  templateUrl: './department-details.html',
  styleUrl: './department-details.scss'
})
export class DepartmentDetails implements OnInit {

  private route = inject(ActivatedRoute);
  public store = inject(OrganizationStore);

  // Expose the selected department as a computed signal for the template
  // This automatically updates if the store state changes
  public departmentDetails = this.store.selectedDepartment;
  
  // Placeholder Data
  public department: Department = {
    name: 'Marine Safety and Security',
    code: 'MSR',
    description: 'Responsible for driving maritime safety, security regulations, and compliance across national waters.',
    head: 'Mr. A. Olumide',
    contactPhone: '+234 800 123 4567',
    directorEmail: 'a.olumide@nimasa.gov.ng',
    metrics: {
        achievedGoals: 12,
        notAchievedGoals: 3,
        inProgressGoals: 7,
        notDoneGoals: 1,
    }
};

public tasks: Task[] = [
    { name: 'Q3 Safety Audit Report', assignedTo: 'Bello T.', status: 'completed' },
    { name: 'Coastal Patrol Expansion Plan', assignedTo: 'Ngozi E.', status: 'in progress' },
    { name: 'Security Equipment Procurement', assignedTo: 'Ahmed M.', status: 'not achieved' },
    { name: 'Training Simulation Development', assignedTo: 'Chike O.', status: 'not done' },
    { name: 'Regulatory Update Review', assignedTo: 'Bello T.', status: 'completed' },
    { name: 'International Treaty Compliance', assignedTo: 'Ngozi E.', status: 'in progress' },
];

public displayedColumns: string[] = ['taskName', 'assignedTo', 'status'];

constructor() {}

ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const departmentCode = params.get('code'); // 'code' must match the route definition (e.g., path: 'details/:code')

    if (departmentCode) {
        // 2. Load the organization data if it's not already loaded
        // This is a safety check; ideally, a parent component loads the main data.
        if (!this.store.organization()) {
             this.store.loadOrganization();
        }

        // 3. Call the store method to select the department
        this.store.selectDepartmentByCode(departmentCode);
    } else {
        // Handle case where 'code' is missing from the route
        this.store.selectDepartment(null); // Deselects any previous department
        console.error("Department code is missing from the route parameters.");
    }
});
}

/**
 * Determines the CSS class for the Mat-Chip based on task status.
 */
getChipClass(status: Task['status']): string {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'status-completed'; // Green
        case 'not achieved':
            return 'status-not-achieved'; // Red
        case 'in progress':
            return 'status-in-progress'; // Amber
        case 'not done':
            return 'status-not-done'; // Gray
        default:
            return '';
    }
}
}
