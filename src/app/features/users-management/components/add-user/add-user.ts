import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UsersService } from '../../services/users';
import { UsersStore } from '../../store/users.store';

@Component({
  selector: 'app-add-user-component',
  standalone: false,
  templateUrl: './add-user.html',
  styleUrl: './add-user.scss'
})
export class AddUser {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly usersStore = inject(UsersStore);
  private readonly dialogRef = inject(MatDialogRef<AddUser>);

  isSubmitting = false;

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['manager', Validators.required],
    status: ['active', Validators.required],
    info: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      age: [0, [Validators.required]],
      image: ['']
    }),
    contact: this.fb.group({
      phone: ['']
    })
  });

  async onSubmit() {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const { email, password, role, info, contact } = this.form.value;

    // Prepare payload using requested schema
    const payload = {
      email,
      password,
      role,
      info: {
        firstName: info.firstName,
        lastName: info.lastName,
        age: Number(info.age) || 0,
        image: info.image
      },
      contact: {
        phone: contact.phone
      }
    } as any;

    try {
      //const created = await this.usersService.createUser(payload);
      await this.usersStore.addUser(payload);
      await this.usersStore.loadUsers();
      this.dialogRef.close(true);
    } catch (e) {
      // Keep dialog open; in a real app you might show a toast/snackbar
      console.error('Failed to create user', e);
    } finally {
      this.isSubmitting = false;
    }
  }
}
