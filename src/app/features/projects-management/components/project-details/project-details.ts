import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project, Milestone, Task } from '../../models/project.model';

@Component({
  selector: 'app-project-details',
  standalone: false,
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss'
})
export class ProjectDetails implements OnInit {

  private route = inject(ActivatedRoute);

  projectId: number | null = null;
  project: Project | null = null;

  // Dummy data for demonstration
  private readonly DUMMY_PROJECTS: Project[] = [
    {
      id: 101,
      name: 'Search & Rescue Fleet Upgrade',
      description: 'Comprehensive upgrade of the search and rescue fleet to enhance maritime safety operations across Nigerian waters. This project includes procurement of new vessels, equipment modernization, and crew training programs.',
      departmentCode: 'MSR',
      departmentName: 'Marine Safety and Rescue',
      status: 'Ongoing',
      priority: 'High',
      startDate: '2024-01-15',
      dueDate: '2025-12-31',
      progress: 65,
      budget: 45000000,
      actualSpent: 28000000,
      projectManager: 'Capt. Ibrahim Musa',
      teamMembers: ['Engr. Adebayo Okon', 'Lt. Ngozi Eze', 'Mr. Chike Okafor', 'Mrs. Fatima Ahmed'],
      milestones: [
        { id: 1, name: 'Vessel Procurement', dueDate: '2024-06-30', status: 'Completed', description: 'Acquire 3 new rescue vessels' },
        { id: 2, name: 'Equipment Installation', dueDate: '2024-12-15', status: 'Completed', description: 'Install modern navigation and communication systems' },
        { id: 3, name: 'Crew Training Program', dueDate: '2025-06-30', status: 'In Progress', description: 'Train 50 crew members on new equipment' },
        { id: 4, name: 'Final Testing & Commissioning', dueDate: '2025-12-31', status: 'Pending', description: 'Complete system testing and official commissioning' }
      ],
      tasks: [
        { id: 1, name: 'Complete vessel sea trials', assignedTo: 'Capt. Ibrahim Musa', status: 'In Progress', dueDate: '2025-02-28', priority: 'High' },
        { id: 2, name: 'Finalize training curriculum', assignedTo: 'Lt. Ngozi Eze', status: 'In Progress', dueDate: '2025-03-15', priority: 'Medium' },
        { id: 3, name: 'Prepare commissioning documentation', assignedTo: 'Mr. Chike Okafor', status: 'Not Started', dueDate: '2025-11-30', priority: 'Low' }
      ]
    },
    {
      id: 102,
      name: 'Maritime Law Review Phase I',
      description: 'Comprehensive review and update of maritime regulations to align with international standards and improve compliance frameworks.',
      departmentCode: 'FLG',
      departmentName: 'Finance, Legal & General Services',
      status: 'Completed',
      priority: 'Medium',
      startDate: '2023-09-01',
      dueDate: '2024-06-15',
      completionDate: '2024-06-10',
      progress: 100,
      budget: 12000000,
      actualSpent: 11500000,
      projectManager: 'Barr. Amina Bello',
      teamMembers: ['Barr. Tunde Adeyemi', 'Mrs. Grace Okonkwo', 'Mr. Ahmed Yusuf'],
      milestones: [
        { id: 1, name: 'Research & Analysis', dueDate: '2023-12-31', status: 'Completed' },
        { id: 2, name: 'Draft Regulations', dueDate: '2024-03-31', status: 'Completed' },
        { id: 3, name: 'Stakeholder Consultation', dueDate: '2024-05-15', status: 'Completed' },
        { id: 4, name: 'Final Approval', dueDate: '2024-06-15', status: 'Completed' }
      ],
      tasks: []
    },
    {
      id: 103,
      name: 'Port Infrastructure Audit',
      description: 'Detailed audit of port infrastructure to identify areas requiring improvement and ensure compliance with safety standards.',
      departmentCode: 'CAP',
      departmentName: 'Cabotage & Port Operations',
      status: 'Outstanding',
      priority: 'Critical',
      startDate: '2024-11-01',
      dueDate: '2025-03-01',
      progress: 15,
      budget: 8500000,
      actualSpent: 1200000,
      projectManager: 'Engr. Oluwaseun Adebisi',
      teamMembers: ['Mr. Bello Tanko', 'Mrs. Chioma Nwankwo'],
      milestones: [
        { id: 1, name: 'Site Inspections', dueDate: '2024-12-15', status: 'In Progress' },
        { id: 2, name: 'Data Analysis', dueDate: '2025-01-31', status: 'Pending' },
        { id: 3, name: 'Report Compilation', dueDate: '2025-02-28', status: 'Pending' },
        { id: 4, name: 'Recommendations', dueDate: '2025-03-01', status: 'Pending' }
      ],
      tasks: [
        { id: 1, name: 'Inspect Lagos Port Complex', assignedTo: 'Engr. Oluwaseun Adebisi', status: 'In Progress', dueDate: '2024-12-10', priority: 'High' },
        { id: 2, name: 'Inspect Port Harcourt facilities', assignedTo: 'Mr. Bello Tanko', status: 'Not Started', dueDate: '2024-12-20', priority: 'High' },
        { id: 3, name: 'Compile preliminary findings', assignedTo: 'Mrs. Chioma Nwankwo', status: 'Not Started', dueDate: '2025-01-15', priority: 'Medium' }
      ]
    },
    {
      id: 104,
      name: 'Training Simulation Center Setup',
      description: 'Establishment of a state-of-the-art maritime training simulation center to enhance capacity building programs.',
      departmentCode: 'HCD',
      departmentName: 'Human Capital Development',
      status: 'Ongoing',
      priority: 'Medium',
      startDate: '2024-07-01',
      dueDate: '2026-06-30',
      progress: 35,
      budget: 75000000,
      actualSpent: 22000000,
      projectManager: 'Dr. Funke Oladipo',
      teamMembers: ['Mr. Samuel Eze', 'Mrs. Aisha Mohammed', 'Engr. David Okoro', 'Ms. Blessing Nnamdi'],
      milestones: [
        { id: 1, name: 'Facility Construction', dueDate: '2025-03-31', status: 'In Progress' },
        { id: 2, name: 'Equipment Procurement', dueDate: '2025-09-30', status: 'Pending' },
        { id: 3, name: 'System Integration', dueDate: '2026-03-31', status: 'Pending' },
        { id: 4, name: 'Staff Training & Launch', dueDate: '2026-06-30', status: 'Pending' }
      ],
      tasks: [
        { id: 1, name: 'Complete building foundation', assignedTo: 'Engr. David Okoro', status: 'In Progress', dueDate: '2025-01-31', priority: 'High' },
        { id: 2, name: 'Finalize equipment specifications', assignedTo: 'Dr. Funke Oladipo', status: 'In Progress', dueDate: '2025-02-28', priority: 'Medium' }
      ]
    },
    {
      id: 105,
      name: 'ERP System Implementation',
      description: 'Implementation of an Enterprise Resource Planning system to streamline financial operations and improve efficiency.',
      departmentCode: 'F&A',
      departmentName: 'Finance & Accounts',
      status: 'Completed',
      priority: 'High',
      startDate: '2023-10-01',
      dueDate: '2024-09-30',
      completionDate: '2024-09-25',
      progress: 100,
      budget: 35000000,
      actualSpent: 33500000,
      projectManager: 'Mr. Adekunle Fashola',
      teamMembers: ['Mrs. Zainab Ibrahim', 'Mr. Peter Obi', 'Ms. Kemi Adeyemi'],
      milestones: [
        { id: 1, name: 'System Selection', dueDate: '2023-12-31', status: 'Completed' },
        { id: 2, name: 'Infrastructure Setup', dueDate: '2024-03-31', status: 'Completed' },
        { id: 3, name: 'Data Migration', dueDate: '2024-06-30', status: 'Completed' },
        { id: 4, name: 'Go-Live & Training', dueDate: '2024-09-30', status: 'Completed' }
      ],
      tasks: []
    }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = parseInt(id, 10);
        this.loadProject(this.projectId);
      }
    });
  }

  private loadProject(id: number): void {
    // In a real application, you would fetch from a service
    this.project = this.DUMMY_PROJECTS.find(p => p.id === id) || null;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'ongoing':
      case 'in progress':
        return 'status-ongoing';
      case 'outstanding':
      case 'delayed':
        return 'status-outstanding';
      case 'pending':
        return 'status-pending';
      case 'blocked':
        return 'status-blocked';
      default:
        return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }
}
