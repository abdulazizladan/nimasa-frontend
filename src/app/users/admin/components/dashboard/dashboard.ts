import { Component, OnInit, inject, computed } from '@angular/core';
import { DashboardStore } from '../../store/dashboard.store';
import { GlobalStateService } from '../../../../core/services/global-state.service';
import { AllDeliverablesService, DELIVERABLE_SOURCES } from '../../../../strategic-deliverables/services/all-deliverables.service';
import { isActiveInYear } from '../../../../strategic-deliverables/utils/kpi-performance';
import { IconName } from '../../../../core/components/icon/icon';
import { ROUTES } from '../../../../core/routes';

/** One of the count tiles at the top of the page */
interface CountTile {
  id: string;
  label: string;
  icon: IconName;
  path: string;
  /** Active in the selected year */
  inYear: number;
  total: number;
}

const TILE_ICONS: Record<string, IconName> = { presidential: 'star', ministerial: 'briefcase', agency: 'chart' };

/** Admin home: counts for the year, then the KPI overview. */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  dashboardStore = inject(DashboardStore);
  private globalState = inject(GlobalStateService);
  /** Shared with the overview below, which loads it */
  private deliverables = inject(AllDeliverablesService);

  readonly usersPath = ROUTES.admin.users;
  year = this.globalState.selectedYear;
  countsLoaded = computed(() => this.deliverables.loaded());

  /** Per page: deliverables active in the selected year (as everything below counts them), and all-time */
  tiles = computed<CountTile[]>(() =>
    DELIVERABLE_SOURCES.map(source => {
      const list = this.deliverables.results().find(r => r.source.id === source.id)?.deliverables ?? [];
      return {
        id: source.id, label: source.title, icon: TILE_ICONS[source.id] ?? 'chart', path: source.pagePath,
        inYear: list.filter(d => isActiveInYear(d, this.year())).length, total: list.length,
      };
    })
  );

  ngOnInit(): void {
    this.dashboardStore.loadStats();
  }

  trackTile(_: number, tile: CountTile): string {
    return tile.id;
  }
}
