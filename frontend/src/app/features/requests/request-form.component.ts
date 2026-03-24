import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { RequestService } from '../../core/request.service';
import { RequestStatus } from '../../core/request.models';
import { ToastService } from '../../core/toast.service';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-form.component.html'
})
export class RequestFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  id: string | null = null;
  loading = false;
  currentStatus: RequestStatus = 'Draft';

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required]],
    priority: ['Medium', [Validators.required]],
    status: ['Draft', [Validators.required]],
    deadline: ['', [Validators.required]]
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: RequestService,
    private readonly toast: ToastService,
    private readonly auth: AuthService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) return;

    this.loading = true;
    this.service.getById(this.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: x => {
          this.currentStatus = (x as any).status as RequestStatus;
          this.form.patchValue({
            ...(x as any),
            // date input expects local format: yyyy-MM-dd
            deadline: this.toLocalDateInputValue((x as any).deadline)
          });
        },
        error: (err) => this.toast.httpError(err, 'Cannot load request.')
      });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      // Date-only UX: persist as end-of-day local time in UTC.
      deadline: new Date(`${raw.deadline}T23:59:59`).toISOString()
    };

    const req$ = this.id
      ? this.service.update(this.id, payload as any)
      : this.service.create(payload as any);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.router.navigate(['/requests']),
      error: (err) => this.toast.httpError(err, 'Save failed.')
    });
  }

  setStatus(status: RequestStatus) {
    if (!this.id) return;
    this.loading = true;
    this.service.changeStatus(this.id, status)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/requests']),
        error: (err) => this.toast.httpError(err, 'Status change failed.')
      });
  }

  get statusOptions(): RequestStatus[] {
    if (!this.id) {
      return ['Draft', 'Open', 'InProgress', 'Done', 'Overdue', 'Cancelled'];
    }

    const isManager = this.auth.role() === 'Manager';
    const from = this.currentStatus;
    const options = new Set<RequestStatus>([from]);

    if (from === 'Draft') options.add('Open');
    if (from === 'Open') {
      options.add('InProgress');
      if (isManager) options.add('Cancelled');
    }
    if (from === 'InProgress') {
      if (isManager) {
        options.add('Done');
        options.add('Cancelled');
      }
    }

    return [...options];
  }

  get isManager() {
    return this.auth.role() === 'Manager';
  }

  private toLocalDateInputValue(value: string) {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
