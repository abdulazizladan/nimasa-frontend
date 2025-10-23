import { Component, inject } from '@angular/core';
import { AuthStore } from '../../store/auth.store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm: FormGroup = this.fb.group({
    email: ['iibrahimbuba@gmail.com', [Validators.required, Validators.email]],
    password: ['password', Validators.required],
  });

  // Get reactive state from the store
  isLoading = this.authStore.loading;
  error = this.authStore.error;

  async submit() {
    //this.authStore.clearError();
    if (this.loginForm.invalid) {
      return;
    }
    const { email, password } = this.loginForm.value;
    try {
      await this.authStore.login({ email, password });
    } catch (error: any) {
      console.error('Login failed:', error);
    }
  }

}
