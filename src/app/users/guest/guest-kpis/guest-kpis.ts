import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GlobalStateService } from '../../../core/services/global-state.service';
import { AllDeliverablesService, DELIVERABLE_SOURCES } from '../../../strategic-deliverables/services/all-deliverables.service';
import {
  AssessedDeliverable, StatusClass, STATUS_CLASSES, summariseFamilies, uniqueItems, ownerOf, periodLabel
} from '../../../strategic-deliverables/utils/portfolio-summary';

/** Worst first: off track, at risk, on track, then no result */
const STATUS_ORDER: Record<StatusClass, number> = { critical: 0, warning: 1, good: 2, none: 3 };

/** Every KPI (presidential, ministerial and agency) for the selected period, searchable and filterable. */
@Component({
  selector: 'app-guest-kpis',
  standalone: false,
  templateUrl: './guest-kpis.html',
  styleUrls: ['../guest-pages.css', './guest-kpis.css'],
})
export class GuestKpis implements OnInit, OnDestroy {
  private service = inject(AllDeliverablesService);
  private globalState = inject(GlobalStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subs: Subscription[] = [];

  readonly typeOptions = DELIVERABLE_SOURCES.map(s => ({ id: s.id, title: s.title }));
  readonly statusOptions = STATUS_CLASSES;

  year = signal(this.globalState.getYear());
  quarter = signal<number | null>(this.globalState.getQuarter());
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

  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    return this.all()
      .filter(i => !this.type() || i.source.id === this.type())
      .filter(i => !this.area() || i.deliverable.priorityArea === this.area())
      .filter(i => !this.owner() || ownerOf(i.deliverable) === this.owner())
      .filter(i => !this.status() || i.status === this.status())
      .filter(i => !text || [i.deliverable.outcome, i.deliverable.deliverable, i.deliverable.indicator, i.deliverable.priorityArea]
        .some(v => (v || '').toLowerCase().includes(text)))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        || a.source.title.localeCompare(b.source.title) || a.deliverable.serialNumber - b.deliverable.serialNumber);
  });
  total = computed(() => this.all().length);

  ngOnInit(): void {
    // Filters can come from the dashboard (e.g. clicking a priority area)
    const params = this.route.snapshot.queryParamMap;
    this.type.set(params.get('type') ?? '');
    this.area.set(params.get('area') ?? '');
    this.owner.set(params.get('owner') ?? '');
    this.subs.push(this.globalState.selectedYear$.subscribe(y => this.year.set(y)));
    this.subs.push(this.globalState.selectedQuarter$.subscribe(q => this.quarter.set(q)));
    this.service.ensureLoaded();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  clearFilters(): void {
    this.search.set('');
    this.type.set('');
    this.area.set('');
    this.owner.set('');
    this.status.set('');
  }

  open(item: AssessedDeliverable): void {
    this.router.navigate(['/guest/kpis', item.deliverable.id]);
  }

  titleOf(item: AssessedDeliverable): string {
    return item.deliverable.outcome || item.deliverable.deliverable || item.deliverable.indicator;
  }

  ownerOf(item: AssessedDeliverable): string {
    return ownerOf(item.deliverable);
  }

  statusLabel(item: AssessedDeliverable): string {
    return item.status === 'none' ? `No result for ${this.periodName()}` : item.assessment.label;
  }
}
