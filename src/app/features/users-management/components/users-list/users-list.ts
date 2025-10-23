import { Component, OnInit, inject } from '@angular/core';
import { UsersStore } from '../../store/users.store';
import { User } from '../../models/user.model';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddUser} from '../add-user/add-user';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-users-list-component',
  standalone: false, // Assuming this should be true for modern components
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss'
})
export class UsersListComponent implements OnInit {
  
  // Store and Dialog are injected and available as public/private properties
  private readonly store = inject(UsersStore);
  private readonly dialog = inject(MatDialog);
  
  // Expose the necessary store signals and computed properties directly
  readonly users = this.store.filteredUsers;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;

  // Expose computed summary counts from the store
  readonly totalUsers = this.store.totalUsers;
  readonly adminUsers = this.store.adminUsers;
  readonly marketManagers = this.store.marketManagers;
  readonly activeUsers = this.store.activeUsers;

  // Table columns
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'phone', 'actions'];

  // Search control
  searchControl = new FormControl('');
  
  constructor() {
    // Live search subscription using takeUntilDestroyed for automatic cleanup
    // This runs in the constructor for simpler initialization
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.store.setSearch(value ?? '');
      });
  }

  ngOnInit(): void {
    // Load data on initialization
    this.store.loadUsers();
  }

  // Helper to format full name safely (Kept as is, it's efficient)
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