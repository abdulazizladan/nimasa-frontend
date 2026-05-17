import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserStore } from '../store/user.store';

@Component({
  selector: 'app-users-list',
  standalone: false,
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersList implements OnInit {
  userStore = inject(UserStore);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.userStore.loadUsers();
  }

  deleteUser(email: string) {
    if (confirm(`Are you sure you want to delete ${email}?`)) {
      this.userStore.deleteUser(email);
    }
  }

  viewDetails(email: string) {
    this.router.navigate(['/admin/users', email]);
  }
}
