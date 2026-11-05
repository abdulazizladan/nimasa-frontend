import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '../store/user.store';
import { CreateUserDto } from '../services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'app-add-user',
  standalone: false,
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser {
  userStore = inject(UserStore);
  private router = inject(Router);
  private toast = inject(ToastService);

  userForm: CreateUserDto = {
    email: '',
    password: '',
    role: 'guest',
    info: { firstName: '', lastName: '' },
    contact: { phone: '' }
  };

  onSubmit(): void {
    this.userStore.createUser({
      payload: this.userForm,
      onSuccess: () => {
        this.toast.success(`${this.userForm.email} can now sign in.`);
        this.router.navigateByUrl(ROUTES.admin.users);
      }
    });
  }

  cancel(): void {
    this.router.navigateByUrl(ROUTES.admin.users);
  }
}
