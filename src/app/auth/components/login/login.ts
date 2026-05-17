import { Component, inject } from '@angular/core';
import { AuthStore } from '../../store/auth.store';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  credentials = { email: '', password: '' };
  
  authStore = inject(AuthStore);

  onSubmit() {
    this.authStore.login(this.credentials);
  }
}
