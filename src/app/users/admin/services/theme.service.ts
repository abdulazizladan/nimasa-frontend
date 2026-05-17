import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'nimasa_theme_mode';
  
  // Create a reactive signal for the current theme
  isDark = signal<boolean>(false);

  constructor() {
    // Read from localStorage on service instantiation
    const storedTheme = localStorage.getItem(this.THEME_KEY);
    if (storedTheme === 'dark') {
      this.setDarkTheme(true);
    } else {
      this.setDarkTheme(false);
    }
  }

  toggleTheme(): void {
    this.setDarkTheme(!this.isDark());
  }

  setDarkTheme(dark: boolean): void {
    this.isDark.set(dark);
    if (dark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem(this.THEME_KEY, 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem(this.THEME_KEY, 'light');
    }
  }
}
