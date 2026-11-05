import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserStore } from '../store/user.store';
import { User, UpdateUserDto } from '../services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ROUTES } from '../../../core/routes';

/** Editable copy of the user's details */
interface UserEdit {
  firstName: string;
  lastName: string;
  phone: string;
  role: User['role'];
  status: NonNullable<User['status']>;
}

@Component({
  selector: 'app-user-details',
  standalone: false,
  templateUrl: './user-details.html',
  styleUrl: './user-details.css',
})
export class UserDetails implements OnInit {
  userStore = inject(UserStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  emailParam = '';
  /** The edit form while editing, or null while viewing */
  edit = signal<UserEdit | null>(null);

  ngOnInit(): void {
    this.emailParam = this.route.snapshot.paramMap.get('email') || '';
    if (this.emailParam) this.userStore.loadUser(this.emailParam);
    else this.router.navigateByUrl(ROUTES.admin.users);
  }

  startEdit(): void {
    const user = this.userStore.selectedUser();
    if (!user) return;
    this.userStore.clearError();
    this.edit.set({
      firstName: user.info?.firstName || '',
      lastName: user.info?.lastName || '',
      phone: user.contact?.phone || '',
      role: user.role,
      status: user.status || 'active'
    });
  }

  cancelEdit(): void {
    this.edit.set(null);
    this.userStore.clearError();
  }

  saveChanges(): void {
    const e = this.edit();
    if (!e) return;
    const payload: UpdateUserDto = {
      role: e.role,
      status: e.status,
      info: { firstName: e.firstName, lastName: e.lastName },
      contact: { phone: e.phone }
    };
    this.userStore.updateUser({
      email: this.emailParam,
      payload,
      onSuccess: () => {
        this.edit.set(null);
        this.toast.success('User saved.');
      }
    });
  }

  initialOf(user: User): string {
    return (user.info?.firstName?.charAt(0) || user.email.charAt(0) || 'U').toUpperCase();
  }

  goBack(): void {
    this.router.navigateByUrl(ROUTES.admin.users);
  }
}
