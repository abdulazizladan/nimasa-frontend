import { Component, inject } from '@angular/core';
import { GlobalStateService } from '../../../core/services/global-state.service';

/** Guest home: the KPI overview (read-only) for the selected year. */
@Component({
  selector: 'app-guest-dashboard',
  standalone: false,
  templateUrl: './guest-dashboard.html',
  styleUrl: './guest-dashboard.css',
})
export class GuestDashboard {
  year = inject(GlobalStateService).selectedYear;
}
