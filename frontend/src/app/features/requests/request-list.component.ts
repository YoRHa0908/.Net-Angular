import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RequestItem, RequestUserLookup } from '../../core/request.models';
import { RequestService } from '../../core/request.service';
import { ToastService } from '../../core/toast.service';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  loading = false;
  hasError = false;
  requests: RequestItem[] = [];
  users: RequestUserLookup[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;
  private requestVersion = 0;

  filterForm = this.fb.nonNullable.group({
    status: [''],
    priority: [''],
    deadlineFrom: [''],
    deadlineTo: [''],
    createdByUserId: [''],
    titleSearch: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9\s\-_]*$/)]],
    page: [1],
    pageSize: [10]
  });

  constructor(private readonly service: RequestService) {}
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  ngOnInit() {
    if (this.isManager) {
      this.service.getUsers().subscribe({
        next: users => (this.users = users),
        error: (err) => this.toast.httpError(err, 'Failed to load users.')
      });
    }
    this.load();
  }

  load() {
    if (this.filterForm.invalid) {
      this.hasError = true;
      this.toast.error('Please fix filter input values.');
      return;
    }

    this.loading = true;
    this.hasError = false;
    const requestId = ++this.requestVersion;
    const raw = this.filterForm.getRawValue() as Record<string, string | number>;
    const filters: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const text = String(value ?? '').trim();
      if (text !== '') {
        if (key === 'deadlineFrom') {
          filters[key] = new Date(`${text}T00:00:00`).toISOString();
        } else if (key === 'deadlineTo') {
          filters[key] = new Date(`${text}T23:59:59.999`).toISOString();
        } else if (key === 'createdByUserId' && text === '__me') {
          const me = this.auth.getUserId();
          if (me) {
            filters[key] = me;
          }
        } else {
          filters[key] = text;
        }
      }
    }
    this.service.getAll(filters)
      .subscribe({
        next: data => {
          if (requestId !== this.requestVersion) return;
          this.requests = data.items;
          this.page = data.page;
          this.pageSize = data.pageSize;
          this.totalCount = data.totalCount;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          if (requestId !== this.requestVersion) return;
          this.hasError = true;
          this.toast.error('Failed to load requests.');
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilters() {
    this.filterForm.patchValue({ page: 1 });
    this.load();
  }

  resetFilters() {
    this.filterForm.reset({
      status: '',
      priority: '',
      deadlineFrom: '',
      deadlineTo: '',
      createdByUserId: '',
      titleSearch: '',
      page: 1,
      pageSize: this.pageSize
    });
    this.applyFilters();
  }

  deleteRequest(id: string) {
    const confirmed = window.confirm('Delete this request?');
    if (!confirmed) return;

    this.loading = true;
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.success('Request deleted.');
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.toast.httpError(err, 'Failed to delete request.');
      }
    });
  }

  nextPage() {
    if (this.page * this.pageSize >= this.totalCount) return;
    this.filterForm.patchValue({ page: this.page + 1 });
    this.load();
  }

  previousPage() {
    if (this.page <= 1) return;
    this.filterForm.patchValue({ page: this.page - 1 });
    this.load();
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get titleSearchControl() {
    return this.filterForm.controls.titleSearch;
  }

  get isManager() {
    return this.auth.role() === 'Manager';
  }
}
