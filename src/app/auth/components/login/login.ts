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
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // Get reactive state from the store
  isLoading = this.authStore.loading;
  error = this.authStore.error;

  async submit() {
    // Clear previous messages
    //this.authStore.clearError();

    // Check if the form is valid before proceeding
    if (this.loginForm.invalid) {
      //this.authStore.setError('Please correct the errors in the form.');
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      // Use the auth store to login
      await this.authStore.login({ email, password });

      // Navigation handled by AuthStore based on role
    } catch (error: any) {
      // Error is automatically handled by the store
      console.error('Login failed:', error);
    }
  }

}
