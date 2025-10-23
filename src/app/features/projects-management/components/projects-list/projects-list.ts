import { Component, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddProject } from '../add-project/add-project';

// 1. Define the Project Interface
export interface Project {
  id: number;
  name: string;
  departmentCode: string; // To link to a department, e.g., 'MSR'
  status: 'Ongoing' | 'Completed' | 'Outstanding';
  dueDate: string; // Using string for simplicity, Date for complex logic
}

@Component({
  selector: 'app-projects-list',
  standalone: false,
  templateUrl: './projects-list.html',
  styleUrls: ['./projects-list.scss']
})
export class ProjectsList implements OnInit {

  private dialog = inject(MatDialog)
  // --- Project Data ---
  readonly PROJECT_DATA: Project[] = [
    { id: 101, name: 'Search & Rescue Fleet Upgrade', departmentCode: 'MSR', status: 'Ongoing', dueDate: '2025-12-31' },
    { id: 102, name: 'Maritime Law Review Phase I', departmentCode: 'FLG', status: 'Completed', dueDate: '2024-06-15' },
    { id: 103, name: 'Port Infrastructure Audit', departmentCode: 'CAP', status: 'Outstanding', dueDate: '2025-03-01' },
    { id: 104, name: 'Training Simulation Center Setup', departmentCode: 'HCD', status: 'Ongoing', dueDate: '2026-06-30' },
    { id: 105, name: 'ERP System Implementation', departmentCode: 'F&A', status: 'Completed', dueDate: '2024-09-30' },
  ];
  
  // --- Mat-Table Properties ---
  readonly displayedColumns: string[] = ['id', 'name', 'departmentCode', 'status', 'dueDate'];
  dataSource: Project[] = this.PROJECT_DATA; // Initial data source

  // Placeholder for filtering logic (to be used with the search input)
  searchQuery: string = '';

  constructor() { }

  ngOnInit(): void {
    // You would typically fetch data here
  }
  
  // --- Computed KPIs (Basic Calculation) ---
  totalProjects = this.PROJECT_DATA.length;
  ongoingProjects = this.PROJECT_DATA.filter(p => p.status === 'Ongoing').length;
  completedProjects = this.PROJECT_DATA.filter(p => p.status === 'Completed').length;
  outstandingProjects = this.PROJECT_DATA.filter(p => p.status === 'Outstanding').length;

  // Simple completion rate calculation
  completionRate = this.totalProjects > 0 
    ? ((this.completedProjects / this.totalProjects) * 100).toFixed(1) 
    : 0;

  // --- Search/Filter Function (Placeholder) ---
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue.trim().toLowerCase();
    
    // In a real application, you'd use MatTableDataSource.filter
    // For this basic example, let's keep it simple:
    this.dataSource = this.PROJECT_DATA.filter(project => 
      project.name.toLowerCase().includes(this.searchQuery) ||
      project.departmentCode.toLowerCase().includes(this.searchQuery)
    );
  }

  addProject() {
    this.dialog.open(AddProject)
  }
}