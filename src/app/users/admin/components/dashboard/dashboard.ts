import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardStore } from '../../store/dashboard.store';
import { GlobalStateService } from '../../../../core/services/global-state.service';
import { Subscription } from 'rxjs';
import { AllDeliverablesService } from '../../../../strategic-deliverables/services/all-deliverables.service';
import { isActiveInYear } from '../../../../strategic-deliverables/utils/kpi-performance';

/** Count shown on a deliverables card: active in the selected year, and all-time */
interface DeliverableCount {
  inYear: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  dashboardStore = inject(DashboardStore);
  globalState = inject(GlobalStateService);
  /** Shared with the overview below, which loads it */
  private deliverables = inject(AllDeliverablesService);
  private router = inject(Router);
  private sub?: Subscription;

  globalYear = new Date().getFullYear().toString();
  private year = signal(Number(this.globalYear));

  /** Whether the deliverable counts have loaded */
  countsLoaded = computed(() => this.deliverables.loaded());

  /** Per page: deliverables active in the selected year (as everything below counts them), and all-time */
  counts = computed<Record<string, DeliverableCount>>(() => {
    const counts: Record<string, DeliverableCount> = {};
    for (const { source, deliverables } of this.deliverables.results()) {
      counts[source.id] = {
        inYear: deliverables.filter(d => isActiveInYear(d, this.year())).length,
        total: deliverables.length,
      };
    }
    return counts;
  });

  // Available years: from 2023 up to next year
  years = Array.from({ length: new Date().getFullYear() - 2021 }, (_, i) => String(2023 + i));

  ngOnInit() {
    this.dashboardStore.loadStats();
    this.sub = this.globalState.selectedYear$.subscribe(year => {
      this.globalYear = year.toString();
      this.year.set(year);
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  onGlobalYearChange(year: string) {
    this.globalState.setYear(parseInt(year, 10));
  }

  navigateTo(path: string) {
    this.router.navigate([`/admin/${path}`]);
  }
}
