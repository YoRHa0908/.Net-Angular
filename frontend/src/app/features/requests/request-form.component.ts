import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { RequestService } from '../../core/request.service';
import { RequestStatus } from '../../core/request.models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-form.component.html'
})
export class RequestFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  id: string | null = null;
  loading = false;
  error = '';

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
    private readonly service: RequestService
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) return;

    this.loading = true;
    this.service.getById(this.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: x => this.form.patchValue(x as any),
        error: () => (this.error = 'Cannot load request.')
      });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const payload = this.form.getRawValue();

    const req$ = this.id
      ? this.service.update(this.id, payload as any)
      : this.service.create(payload as any);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.router.navigate(['/requests']),
      error: () => (this.error = 'Save failed.')
    });
  }

  setStatus(status: RequestStatus) {
    if (!this.id) return;
    this.loading = true;
    this.service.changeStatus(this.id, status)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/requests']),
        error: () => (this.error = 'Status change failed.')
      });
  }
}
