import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { UsersStore } from '../../store/users.store';
import { ActivatedRoute } from '@angular/router';
import { patchState } from '@ngrx/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { StatusConfirmDialog } from '../status-confirm-dialog/status-confirm-dialog';

@Component({
  selector: 'app-user-details',
  standalone: false,
  templateUrl: './user-details.html',
  styleUrl: './user-details.scss'
})
export class UserDetails {

  private route = inject(ActivatedRoute);
  public store = inject(UsersStore);
  private dialog = inject(MatDialog);
  
  private paramMap = toSignal(this.route.paramMap);
  
  private userEmail = computed(() => this.paramMap()?.get('email'));

  public user = computed(() => this.store.selectedUser());

  constructor() {
    effect(() => {
      const email = this.userEmail();
      
      console.log('Route email parameter detected:', email); // Log for debugging

      if (email) {
        this.store.fetchUserByEmail(email);
      } else {
        this.store.clearError(); 
      }
    });
  }

  public onStatusToggle(currentValue: boolean, userId: string): void {
    // The new status we are attempting to set
    const newStatus = currentValue ? 'inactive' : 'active';

    const dialogRef = this.dialog.open(StatusConfirmDialog);

    dialogRef.afterClosed().subscribe((confirmed: any) => {
      if (confirmed) {
        // User confirmed the action
        console.log(`User confirmed status change for ID: ${userId} to ${newStatus}`);
        
        // TODO: Call your store or service method to update the user's status
        // this.store.updateUserStatus(userId, newStatus); 

      } else {
        // User cancelled the action. The toggle state remains visually unchanged
        // because the slide-toggle only reflects the [checked] binding, 
        // which is tied to selectedUser.status.
        console.log('User cancelled status change.');
      }
    });
  }
}
