import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '../store/user.store';

@Component({
  selector: 'app-add-user',
  standalone: false,
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser {
  userForm = {
    email: '',
    password: '',
    role: 'guest',
    info: {
      firstName: '',
      lastName: '',
    },
    contact: {
      phone: ''
    }
  };
  
  userStore = inject(UserStore);

  constructor(private router: Router) {}

  onSubmit() {
    this.userStore.createUser({
      payload: this.userForm,
      onSuccess: () => {
        this.router.navigate(['/admin/users']);
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/users']);
  }
}
