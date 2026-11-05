import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../auth/services/auth.service';
import { ROUTES } from '../../../../core/routes';
import { FIRST_YEAR } from '../../../../core/years';

/** The signed-in account and where things are managed. */
@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  readonly user = inject(AuthService).getUser();
  readonly routes = ROUTES.admin;
  readonly firstYear = FIRST_YEAR;
  readonly lastYear = new Date().getFullYear() + 1;
}
