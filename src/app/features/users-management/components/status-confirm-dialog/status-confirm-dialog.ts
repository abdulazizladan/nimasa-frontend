import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-status-confirm-dialog',
  standalone: false,
  templateUrl: './status-confirm-dialog.html',
  styleUrl: './status-confirm-dialog.scss'
})
  export class StatusConfirmDialog {
    public dialogRef = inject(MatDialogRef<StatusConfirmDialog>);
}
