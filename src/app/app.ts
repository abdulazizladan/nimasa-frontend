import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('nimasa');
  private intervalId: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.intervalId = setInterval(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            this.router.navigate(['/auth/login']);
          }
        } catch (e) {
          // ignore
        }
      }
    }, 10000); // check every 10 seconds
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
