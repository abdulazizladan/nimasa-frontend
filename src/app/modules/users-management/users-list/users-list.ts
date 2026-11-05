import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '../store/user.store';
import { User } from '../services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { ROUTES } from '../../../core/routes';

@Component({
  selector: 'app-users-list',
  standalone: false,
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersList implements OnInit {
  userStore = inject(UserStore);
  private router = inject(Router);
  private toast = inject(ToastService);

  /** User awaiting delete confirmation */
  deleting = signal<User | null>(null);

  ngOnInit(): void {
    this.userStore.loadUsers();
  }

  confirmDelete(): void {
    const user = this.deleting();
    if (!user) return;
    this.deleting.set(null);
    this.userStore.deleteUser({ email: user.email, onSuccess: () => this.toast.success(`${user.email} deleted.`) });
  }

  viewDetails(email: string): void {
    this.router.navigateByUrl(ROUTES.admin.user(email));
  }

  initialOf(user: User): string {
    return (user.info?.firstName?.charAt(0) || user.email.charAt(0) || 'U').toUpperCase();
  }

  nameOf(user: User): string {
    return [user.info?.firstName, user.info?.lastName].filter(Boolean).join(' ') || user.email;
  }
}
