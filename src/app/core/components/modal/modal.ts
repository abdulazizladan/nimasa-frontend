import { Component, ElementRef, OnDestroy, HostListener, afterNextRender, inject, input, output, viewChild } from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * Accessible modal shell: a dialog with a titled header, a close button, a scrolling body and a
 * footer. It moves focus inside on open, keeps Tab within the dialog, closes on Escape or a
 * click on the backdrop, and returns focus to where it was when it closes.
 *
 *   <app-modal title="Edit department" size="lg" (closed)="close()">
 *     <form> ...body... </form>
 *     <ng-container footer> <button class="btn btn-secondary" ...>Cancel</button> </ng-container>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="modal-overlay" (click)="onBackdrop($event)">
      <div #box class="modal" [class.modal-sm]="size() === 'sm'" [class.modal-lg]="size() === 'lg'"
        role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 [id]="titleId">{{ title() }}</h2>
          <button type="button" class="btn-icon" aria-label="Close" (click)="closed.emit()">
            <app-icon name="close" />
          </button>
        </div>
        <ng-content></ng-content>
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
})
export class Modal implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private box = viewChild.required<ElementRef<HTMLElement>>('box');
  private opener: Element | null = null;

  title = input.required<string>();
  size = input<'sm' | 'md' | 'lg'>('md');
  /** Set false to keep the dialog open on backdrop clicks (e.g. while saving) */
  closeOnBackdrop = input(true);
  closed = output<void>();

  readonly titleId = `modal-title-${nextId++}`;

  constructor() {
    this.opener = document.activeElement;
    // Focus once the projected content has rendered and ngModel has applied any disabled states
    // (it does that in a microtask): the first editable field, else any control, else the dialog
    afterNextRender(() => setTimeout(() => {
      const candidates = this.focusable().filter(el => !el.closest('.modal-header'));
      const first = candidates.find(el => !el.hasAttribute('readonly')) ?? candidates[0];
      const target = first ?? this.box().nativeElement;
      if (target === this.box().nativeElement) target.setAttribute('tabindex', '-1');
      target.focus();
    }, 0));
  }

  ngOnDestroy(): void {
    if (this.opener instanceof HTMLElement && document.contains(this.opener)) this.opener.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = this.focusable();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !this.host.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onBackdrop(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) this.closed.emit();
  }

  private focusable(): HTMLElement[] {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.box().nativeElement.querySelectorAll<HTMLElement>(selector))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }
}
