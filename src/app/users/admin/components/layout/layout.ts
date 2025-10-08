import { Component, inject, OnInit } from '@angular/core';
import { AuthStore } from '../../../../auth/store/auth.store';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {

  public authStore = inject(AuthStore);

  public logout() {
    this.authStore.logout()
  }

  ngOnInit() {}
  
}
