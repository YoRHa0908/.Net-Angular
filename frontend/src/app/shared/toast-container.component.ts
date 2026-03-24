import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrap position-fixed top-0 end-0 p-3" style="z-index: 1080;">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-item alert mb-2 py-2 px-3 shadow-sm"
        [class.alert-danger]="toast.type === 'error'"
        [class.alert-success]="toast.type === 'success'"
        [class.alert-info]="toast.type === 'info'"
      >
        <div class="d-flex align-items-start">
          <span>{{ toast.text }}</span>
          <button
            type="button"
            class="btn-close ms-3"
            aria-label="Close"
            (click)="toastService.remove(toast.id)"
          ></button>
        </div>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
