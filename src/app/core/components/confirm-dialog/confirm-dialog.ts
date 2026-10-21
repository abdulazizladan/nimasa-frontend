import { Component, ElementRef, AfterViewInit, input, output, viewChild, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';

/**
 * Modal "Are you sure?" dialog. Focuses Cancel first (the safe choice); Escape or a click
 * outside the box also cancels.
 *
 *   <app-confirm-dialog *ngIf="confirming" title="Log out?" message="..." confirmLabel="Log out"
 *     (confirmed)="..." (cancelled)="confirming = false"></app-confirm-dialog>
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NgIf],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog implements AfterViewInit {
  title = input('Are you sure?');
  message = input('');
  confirmLabel = input('Confirm');
  cancelLabel = input('Cancel');

  confirmed = output<void>();
  cancelled = output<void>();

  private cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  ngAfterViewInit(): void {
    this.cancelButton()?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancelled.emit();
  }
}
