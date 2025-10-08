import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { UsersStore } from '../../store/users.store';
import { User } from '../../models/user.model';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddUser} from '../add-user/add-user';

@Component({
  selector: 'app-users-list-component',
  standalone: false,
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss'
})
export class UsersListComponent implements OnInit, OnDestroy {
  
  private readonly store = inject(UsersStore);

  private readonly dialog = inject(MatDialog);

  // Table columns
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'phone', 'actions'];

  // Reactive state signals
  users = this.store.filteredUsers;
  allUsers = this.store.users;

  // Summary counts
  get totalUsers(): number {
    return this.allUsers().length;
  }

  get adminUsers(): number {
    return this.allUsers().filter(u => (u.role || '').toLowerCase() === 'admin').length;
  }

  get marketManagers(): number {
    return this.allUsers().filter(u => (u.role || '').toLowerCase() === 'manager' || (u.role || '').toLowerCase() === 'market manager' || (u.role || '').toLowerCase() === 'market_manager').length;
  }

  get activeUsers(): number {
    return this.allUsers().filter(u => (u.status || '').toLowerCase() === 'active').length;
  }
  isLoading = this.store.isLoading;
  error = this.store.error;

  // Search control
  searchControl = new FormControl('');
  private sub?: Subscription;

  ngOnInit(): void {
    this.store.loadUsers();

    // Live search
    this.sub = this.searchControl.valueChanges.subscribe((value) => {
      this.store.setSearch(value ?? '');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Helper to format full name safely
  getFullName(user: User): string {
    const first = user.info?.firstName ?? '';
    const last = user.info?.lastName ?? '';
    return `${first} ${last}`.trim();
  }

  openAddUserDialog() {
    this.dialog.open(AddUser, {
      width: '480px'
    })
  }
}
