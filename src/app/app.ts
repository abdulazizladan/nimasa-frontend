import { Component } from '@angular/core';

/** Root shell: just the router outlet. Session expiry is checked by the route guards. */
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {}
