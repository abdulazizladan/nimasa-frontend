import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Deliverable, DeliverableSummary } from '../models/deliverable.model';
import { DeliverableService } from '../services/deliverable';

@Component({
  selector: 'app-deliverables-dashboard',
  standalone: false,
  templateUrl: './deliverables-dashboard.html',
  styleUrl: './deliverables-dashboard.scss'
})
export class DeliverablesDashboard implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource: MatTableDataSource<Deliverable>;
  summary: DeliverableSummary | null = null;
  isLoading = false;
  error: string | null = null;

  displayedColumns: string[] = [
    'serialNumber',
    'ministry',
    'priorityArea',
    'deliverable',
    'responsibleDepartment',
    'annual_2024_target',
    'annual_2024_actual',
    'progress',
    'actions'
  ];

  filterForm = new FormGroup({
    ministry: new FormControl(''),
    priorityArea: new FormControl(''),
    responsibleDepartment: new FormControl('')
  });

  ministries: string[] = [];
  priorityAreas: string[] = [];
  departments: string[] = [];

  constructor(
    private deliverableService: DeliverableService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.dataSource = new MatTableDataSource<Deliverable>([]);
  }

  ngOnInit(): void {
    this.loadSummary();
    this.loadDeliverables();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSummary(): void {
    this.deliverableService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (err) => {
        console.error('Error loading summary:', err);
      }
    });
  }

  loadDeliverables(): void {
    this.isLoading = true;
    this.error = null;

    this.deliverableService.getAll().subscribe({
      next: (deliverables) => {
        this.dataSource.data = deliverables;
        this.extractFilterOptions(deliverables);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load deliverables. Please try again.';
        this.isLoading = false;
        console.error('Error loading deliverables:', err);
      }
    });
  }

  extractFilterOptions(deliverables: Deliverable[]): void {
    this.ministries = [...new Set(deliverables.map(d => d.ministry))].sort();
    this.priorityAreas = [...new Set(deliverables.map(d => d.priorityArea))].sort();
    this.departments = [...new Set(deliverables.map(d => d.responsibleDepartment))].sort();
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    this.dataSource.data = this.dataSource.data.filter(deliverable => {
      return (!filters.ministry || deliverable.ministry === filters.ministry) &&
        (!filters.priorityArea || deliverable.priorityArea === filters.priorityArea) &&
        (!filters.responsibleDepartment || deliverable.responsibleDepartment === filters.responsibleDepartment);
    });

    if (!Object.values(filters).some(v => v)) {
      this.loadDeliverables();
    }
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.loadDeliverables();
  }

  calculateProgress(deliverable: Deliverable): number {
    if (!deliverable.annual_2024_target || deliverable.annual_2024_target === 0) {
      return 0;
    }
    const progress = ((deliverable.annual_2024_actual || 0) / deliverable.annual_2024_target) * 100;
    return Math.min(Math.round(progress), 100);
  }

  exportToCsv(): void {
    this.deliverableService.exportToCsv(this.dataSource.data);
  }

  viewDetails(id: string): void {
    this.router.navigate(['./', id], { relativeTo: this.route });
  }

  editDeliverable(id: string): void {
    this.router.navigate(['./', id, 'edit'], { relativeTo: this.route });
  }

  deleteDeliverable(id: string): void {
    if (confirm('Are you sure you want to delete this deliverable?')) {
      this.deliverableService.delete(id).subscribe({
        next: () => {
          this.loadDeliverables();
          this.loadSummary();
        },
        error: (err) => {
          console.error('Error deleting deliverable:', err);
          alert('Failed to delete deliverable. Please try again.');
        }
      });
    }
  }

  createNew(): void {
    this.router.navigate(['./new'], { relativeTo: this.route });
  }
}
