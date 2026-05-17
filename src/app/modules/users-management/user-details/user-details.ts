import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserStore } from '../store/user.store';

@Component({
  selector: 'app-user-details',
  standalone: false,
  templateUrl: './user-details.html',
  styleUrl: './user-details.css',
})
export class UserDetails implements OnInit {
  userStore = inject(UserStore);
  editMode = false;
  emailParam = '';
  editableUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.emailParam = this.route.snapshot.paramMap.get('email') || '';
    if (this.emailParam) {
      this.userStore.loadUser(this.emailParam);
    } else {
      this.router.navigate(['/admin/users']);
    }
  }

  get displayUser() {
    return this.editMode ? this.editableUser : this.userStore.selectedUser();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      const current = this.userStore.selectedUser();
      if (current) {
        this.editableUser = JSON.parse(JSON.stringify(current));
      }
    }
  }

  saveChanges() {
    if (!this.editableUser) return;

    const updatePayload = {
      role: this.editableUser.role,
      status: this.editableUser.status,
      info: {
        firstName: this.editableUser.info?.firstName,
        lastName: this.editableUser.info?.lastName
      },
      contact: {
        phone: this.editableUser.contact?.phone
      }
    };

    this.userStore.updateUser({
      email: this.emailParam,
      payload: updatePayload,
      onSuccess: () => {
        this.editMode = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
