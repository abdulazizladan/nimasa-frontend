import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StrategicDeliverablesStore } from '../../store/strategic-deliverables.store';
import { PriorityArea } from '../../services/strategic-deliverables.service';
import { ToastService } from '../../../core/services/toast.service';
import { Modal } from '../../../core/components/modal/modal';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';
import { Icon } from '../../../core/components/icon/icon';

/** The page's priority areas, with create, rename and delete for admins. */
@Component({
  selector: 'app-priority-areas-tab',
  standalone: true,
  imports: [FormsModule, Modal, ConfirmDialog, Icon],
  templateUrl: './priority-areas-tab.html',
  styleUrl: './priority-areas-tab.css',
})
export class PriorityAreasTab {
  store = inject(StrategicDeliverablesStore);
  private toast = inject(ToastService);

  canEdit = input(false);

  /** The area being edited in the modal (id null = new), or null when the modal is closed */
  editing = signal<{ id: string | null; name: string } | null>(null);
  deleting = signal<PriorityArea | null>(null);
  formError = signal('');

  openNew(): void {
    this.formError.set('');
    this.store.clearError();
    this.editing.set({ id: null, name: '' });
  }

  openEdit(area: PriorityArea): void {
    this.formError.set('');
    this.store.clearError();
    this.editing.set({ id: area.id, name: area.name });
  }

  close(): void {
    this.editing.set(null);
    this.store.clearError();
  }

  setName(name: string): void {
    this.editing.update(e => (e ? { ...e, name } : e));
  }

  submit(): void {
    const editing = this.editing();
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) {
      this.formError.set('Please enter a priority area name.');
      return;
    }
    this.formError.set('');
    const onSuccess = () => {
      this.close();
      this.toast.success(editing.id ? 'Priority area updated.' : 'Priority area created.');
    };
    if (editing.id) this.store.updatePriorityArea({ id: editing.id, name, onSuccess });
    else this.store.createPriorityArea({ name, onSuccess });
  }

  confirmDelete(): void {
    const area = this.deleting();
    if (!area) return;
    this.deleting.set(null);
    this.store.deletePriorityArea({ id: area.id, onSuccess: () => this.toast.success(`"${area.name}" deleted.`) });
  }
}
