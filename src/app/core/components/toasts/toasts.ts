import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { Icon } from '../icon/icon';

/** Renders the ToastService queue. Placed once in each portal layout. */
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="toast-host" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.success]="t.kind === 'success'" [class.error]="t.kind === 'error'" role="status">
          <app-icon [name]="t.kind === 'success' ? 'check-circle' : t.kind === 'error' ? 'warning' : 'info'" />
          <span>{{ t.text }}</span>
          <button type="button" class="close" aria-label="Dismiss" (click)="toasts.dismiss(t.id)"><app-icon name="close" /></button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  toasts = inject(ToastService);
}
