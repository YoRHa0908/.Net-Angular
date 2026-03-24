import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  loading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    role: ['User', [Validators.required]]
  });

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const msg = this.clientValidationSummary();
      this.toast.error(msg || 'Please correct the highlighted fields.');
      return;
    }
    this.loading = true;
    this.auth.register(this.form.getRawValue())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.router.navigate(['/requests']),
        error: (err) => this.toast.httpError(err, 'Registration failed.')
      });
  }

  private clientValidationSummary(): string {
    const parts: string[] = [];
    const email = this.form.controls.email;
    if (email.invalid) {
      if (email.errors?.['required']) parts.push('Email is required.');
      else if (email.errors?.['email']) parts.push('Enter a valid email address.');
      else if (email.errors?.['maxlength']) parts.push('Email must be at most 256 characters.');
    }
    const password = this.form.controls.password;
    if (password.invalid) {
      if (password.errors?.['required']) parts.push('Password is required.');
      else if (password.errors?.['minlength']) parts.push('Password must be at least 6 characters.');
      else if (password.errors?.['maxlength']) parts.push('Password must be at most 100 characters.');
    }
    if (this.form.controls.role.invalid && this.form.controls.role.errors?.['required']) {
      parts.push('Role is required.');
    }
    return parts.join(' ');
  }
}
