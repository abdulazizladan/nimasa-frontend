import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Department } from '../../services/organization.service';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { StrategicDeliverable } from '../../../strategic-deliverables/services/strategic-deliverables.service';
import { DeliverablesConfig, CATEGORY_LABELS } from '../../../strategic-deliverables/deliverables-config';
import { AllDeliverablesService } from '../../../strategic-deliverables/services/all-deliverables.service';
import { statusClassOf, StatusClass } from '../../../strategic-deliverables/utils/portfolio-summary';
import * as KPI from '../../../strategic-deliverables/utils/kpi-performance';

/** A deliverable assigned to the department, scored for the selected year */
interface LinkedRow {
  deliverable: StrategicDeliverable;
  /** Page the deliverable opens on */
  source: DeliverablesConfig;
  typeLabel: string;
  title: string;
  summary: KPI.YearSummary | null;
  assessment: KPI.Assessment;
  status: StatusClass;
}

/** Normalised department name for matching (deliverables store the department name as text). */
const normalise = (name: string | undefined) => (name || '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * A department and every presidential, ministerial and agency deliverable assigned to it:
 * /organization/departments/:code. Everything is derived from the shared deliverables cache.
 */
@Component({
  selector: 'app-department-detail',
  standalone: false,
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.css',
})
export class DepartmentDetail implements OnInit {
  private service = inject(AllDeliverablesService);
  private globalState = inject(GlobalStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private code = toSignal(this.route.paramMap.pipe(map(p => p.get('code') || '')), { initialValue: '' });
  year = this.globalState.selectedYear;
  loading = computed(() => !this.service.loaded());

  // Departments are found by code: some existing departments have ids the API can't look up
  department = computed<Department | null>(() => this.service.departments().find(d => d.code === this.code()) ?? null);
  /** Deliverables pages that could not be loaded, so the list may be incomplete */
  failedSources = computed(() => this.service.results().filter(r => r.failed).map(r => r.source.title));

  /** Every deliverable whose responsible department is this one, each once, scored for the year */
  rows = computed<LinkedRow[]>(() => {
    const name = normalise(this.department()?.name);
    if (!name) return [];
    const seen = new Set<string>();
    const rows: LinkedRow[] = [];
    for (const { source, deliverables } of this.service.results()) {
      for (const d of deliverables) {
        if (seen.has(d.id) || normalise(d.responsibleDepartment) !== name) continue;
        seen.add(d.id);
        const summary = KPI.getYearSummary(d, this.year());
        const assessment = KPI.assess(d, summary?.actual, summary?.target, this.year());
        rows.push({
          deliverable: d, source, typeLabel: CATEGORY_LABELS[d.category] ?? d.category, title: KPI.deliverableTitle(d),
          summary, assessment, status: statusClassOf(assessment.cls)
        });
      }
    }
    return rows;
  });

  dataYears = computed(() => this.rows().flatMap(r => KPI.getActiveYears(r.deliverable)));

  typeCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.rows()) counts.set(r.typeLabel, (counts.get(r.typeLabel) ?? 0) + 1);
    return [...counts.entries()].map(([label, count]) => ({ label, count }));
  });

  statusCounts = computed(() => {
    const counts = { good: 0, warning: 0, critical: 0, none: 0 };
    for (const r of this.rows()) counts[r.status]++;
    return counts;
  });

  ngOnInit(): void {
    this.service.ensureLoaded();
  }

  trackRow(_: number, row: LinkedRow): string {
    return row.deliverable.id;
  }

  /** Opens the deliverable on its own page, expanded, on the selected year. */
  openDeliverable(row: LinkedRow): void {
    this.router.navigate([row.source.pagePath], { queryParams: { year: this.year(), expand: row.deliverable.id } });
  }

  back(): void {
    this.router.navigate(['./'], { relativeTo: this.route.parent });
  }
}
