import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../../auth/store/auth.store';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private authStore = inject(AuthStore);

  logout() {
    this.authStore.logout();
  }
}
