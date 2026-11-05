import { Component, inject } from '@angular/core';
import { AuthStore } from '../../store/auth.store';
import { LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  credentials: LoginRequest = { email: '', password: '' };
  authStore = inject(AuthStore);

  onSubmit(): void {
    this.authStore.login(this.credentials);
  }
}
