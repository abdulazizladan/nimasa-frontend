import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrganizationService, Department } from '../../services/organization.service';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { StrategicDeliverable } from '../../../strategic-deliverables/services/strategic-deliverables.service';
import { DeliverablesConfig, CATEGORY_LABELS } from '../../../strategic-deliverables/deliverables-config';
import { AllDeliverablesService } from '../../../strategic-deliverables/services/all-deliverables.service';
import { statusClassOf } from '../../../strategic-deliverables/utils/portfolio-summary';
import * as KPI from '../../../strategic-deliverables/utils/kpi-performance';

interface LinkedDeliverable {
  deliverable: StrategicDeliverable;
  /** Page the deliverable opens on */
  source: DeliverablesConfig;
  typeLabel: string;
}

/** Normalised department name for matching (deliverables store the department name as text). */
const normalise = (name: string | undefined) => (name || '').trim().replace(/\s+/g, ' ').toLowerCase();

/** A department and every presidential, ministerial and agency deliverable assigned to it: /departments/:code */
@Component({
  selector: 'app-department-detail',
  standalone: false,
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.css',
})
export class DepartmentDetail implements OnInit, OnDestroy {
  private service = inject(OrganizationService);
  private allDeliverables = inject(AllDeliverablesService);
  private globalState = inject(GlobalStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subs: Subscription[] = [];

  department = signal<Department | null>(null);
  linked = signal<LinkedDeliverable[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  /** Deliverables pages that could not be loaded, so the list may be incomplete */
  failedSources = signal<string[]>([]);
  year = signal(new Date().getFullYear().toString());

  years = computed(() => {
    const set = new Set<number>();
    for (let y = 2023; y <= new Date().getFullYear() + 1; y++) set.add(y);
    for (const l of this.linked()) KPI.getActiveYears(l.deliverable).forEach(y => set.add(y));
    set.add(Number(this.year()));
    return [...set].sort((a, b) => a - b).map(String);
  });

  /** Counts per deliverable type, for the summary chips */
  typeCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const l of this.linked()) counts.set(l.typeLabel, (counts.get(l.typeLabel) ?? 0) + 1);
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  });

  /** How many deliverables are on track / at risk / off track for the selected year */
  statusCounts = computed(() => {
    let good = 0, warning = 0, bad = 0, none = 0;
    for (const row of this.linked()) {
      const status = statusClassOf(this.assessYear(row).cls);
      if (status === 'good') good++;
      else if (status === 'warning') warning++;
      else if (status === 'critical') bad++;
      else none++;
    }
    return { good, warning, bad, none };
  });

  ngOnInit(): void {
    this.subs.push(this.globalState.selectedYear$.subscribe(y => this.year.set(y.toString())));
    this.subs.push(this.route.paramMap.subscribe(params => this.load(params.get('code') || '')));
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private load(code: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.failedSources.set([]);

    // Departments are found by code: some existing departments have ids the API can't look up
    const department$ = this.service.getDepartments().pipe(
      map(list => (Array.isArray(list) ? list : (list as any)?.data ?? []) as Department[]),
      map(list => list.find(d => d.code === code) ?? null)
    );
    forkJoin([department$, this.allDeliverables.loadAll()]).subscribe({
      next: ([department, results]) => {
        this.department.set(department);
        this.failedSources.set(results.filter(r => r.failed).map(r => r.source.title));

        const name = normalise(department?.name);
        const seen = new Set<string>();
        const rows: LinkedDeliverable[] = [];
        for (const { source, deliverables } of results) {
          for (const d of deliverables) {
            // "Ministerial and Presidential" deliverables come back from two pages; list them once
            if (!name || seen.has(d.id) || normalise(d.responsibleDepartment) !== name) continue;
            seen.add(d.id);
            rows.push({ deliverable: d, source, typeLabel: CATEGORY_LABELS[d.category] ?? d.category });
          }
        }
        this.linked.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load this department.');
        this.loading.set(false);
      }
    });
  }

  onYearChange(year: string): void {
    this.globalState.setYear(Number(year));
  }

  summary(row: LinkedDeliverable) {
    return KPI.getYearSummary(row.deliverable, this.year());
  }

  assessYear(row: LinkedDeliverable) {
    const s = this.summary(row);
    return KPI.assess(row.deliverable, s?.actual, s?.target, this.year());
  }

  /** Opens the deliverable on its own page, expanded, on the selected year. */
  openDeliverable(row: LinkedDeliverable): void {
    this.router.navigate([row.source.pagePath], {
      queryParams: { year: this.year(), expand: row.deliverable.id }
    });
  }

  back(): void {
    this.router.navigate(['./'], { relativeTo: this.route.parent });
  }
}
