import { platformBrowser } from '@angular/platform-browser';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AppModule } from './app/app-module';

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  providers: [
    provideNativeDateAdapter()
  ]
})
  .catch(err => console.error(err));
