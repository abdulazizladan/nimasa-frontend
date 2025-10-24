import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UsersStore } from '../../store/users.store';

interface NewUserPayload {
  email: string;
  password?: string;
  role: string;
  info: {
    firstName: string;
    lastName: string;
    image: string;
  };
  contact: {
    phone: string;
  };
}

@Component({
  selector: 'app-add-user-component',
  standalone: false,
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss'
})
export class AddUser {
  private readonly fb = inject(FormBuilder);
  private readonly usersStore = inject(UsersStore);
  private readonly dialogRef = inject(MatDialogRef<AddUser>); 

  isSubmitting = false;

  // Form definition: default role is 'guest'
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['guest', Validators.required], // Default set to 'guest'
    info: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      image: [''] 
    }),
    contact: this.fb.group({
      phone: [''] 
    })
  });

  async onSubmit() {
    this.form.markAllAsTouched(); 
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;

    // Prepare payload, defensively ensuring all required fields and sub-objects are present.
    const payload: NewUserPayload = {
      email: formValue.email || '',
      password: formValue.password || '',
      role: formValue.role || 'guest', 
      info: {
        firstName: formValue.info?.firstName || '',
        lastName: formValue.info?.lastName || '',
        image: formValue.info?.image || ''
      },
      contact: {
        phone: formValue.contact?.phone || ''
      }
    };

    try {
      // 1. Call the store's addUser action
      await this.usersStore.addUser(payload);
      
      // 2. Reload the list to show the new user
      await this.usersStore.loadUsers(); 
      
      // 3. Close the dialog on success
      this.dialogRef.close(true);
    } catch (e) {
      console.error('Failed to create user', e);
    } finally {
      this.isSubmitting = false;
    }
  }
}
