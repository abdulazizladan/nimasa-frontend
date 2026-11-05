import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { AllDeliverablesService, TYPE_OPTIONS } from '../../../strategic-deliverables/services/all-deliverables.service';
import {
  AssessedDeliverable, STATUS_CLASSES, summariseFamilies, uniqueItems, ownerOf, periodLabel, filterKpis, worstFirst
} from '../../../strategic-deliverables/utils/portfolio-summary';
import { deliverableTitle } from '../../../strategic-deliverables/utils/kpi-performance';
import { ROUTES } from '../../../core/routes';

/** Every KPI (presidential, ministerial and agency) for the selected period, searchable and filterable. */
@Component({
  selector: 'app-guest-kpis',
  standalone: false,
  templateUrl: './guest-kpis.html',
  styleUrls: ['../guest-pages.css', './guest-kpis.css'],
})
export class GuestKpis implements OnInit {
  private service = inject(AllDeliverablesService);
  private globalState = inject(GlobalStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly typeOptions = TYPE_OPTIONS;
  readonly statusOptions = STATUS_CLASSES;

  year = this.globalState.selectedYear;
  quarter = this.globalState.selectedQuarter;
  periodName = computed(() => periodLabel({ year: this.year(), quarter: this.quarter() }));
  loading = computed(() => !this.service.loaded());

  search = signal('');
  type = signal('');
  area = signal('');
  owner = signal('');
  status = signal('');
  hasFilters = computed(() => !!(this.search() || this.type() || this.area() || this.owner() || this.status()));

  /** Every KPI active in the year, scored for the period (each once, even if on two pages) */
  private all = computed<AssessedDeliverable[]>(() =>
    uniqueItems(summariseFamilies(this.service.results(), this.year(), this.quarter()))
  );

  areaOptions = computed(() => [...new Set(this.all().map(i => i.deliverable.priorityArea).filter(Boolean))].sort());
  ownerOptions = computed(() => [...new Set(this.all().map(i => ownerOf(i.deliverable)))].sort());

  /** Same filter and order as the dashboard's KPI list: worst first */
  shown = computed(() =>
    filterKpis(this.all(), { status: this.status(), type: this.type(), owner: this.owner(), area: this.area(), text: this.search() })
      .sort(worstFirst)
  );
  total = computed(() => this.all().length);

  ngOnInit(): void {
    // Filters can come from the dashboard (e.g. clicking a department)
    const params = this.route.snapshot.queryParamMap;
    this.type.set(params.get('type') ?? '');
    this.area.set(params.get('area') ?? '');
    this.owner.set(params.get('owner') ?? '');
    this.service.ensureLoaded();
  }

  trackItem(_: number, item: AssessedDeliverable): string {
    return item.deliverable.id;
  }

  clearFilters(): void {
    this.search.set('');
    this.type.set('');
    this.area.set('');
    this.owner.set('');
    this.status.set('');
  }

  open(item: AssessedDeliverable): void {
    this.router.navigateByUrl(ROUTES.guest.kpi(item.deliverable.id));
  }

  titleOf(item: AssessedDeliverable): string {
    return deliverableTitle(item.deliverable);
  }

  ownerOf(item: AssessedDeliverable): string {
    return ownerOf(item.deliverable);
  }

  statusLabel(item: AssessedDeliverable): string {
    return item.status === 'none' ? `No actual for ${this.periodName()}` : item.assessment.label;
  }
}
