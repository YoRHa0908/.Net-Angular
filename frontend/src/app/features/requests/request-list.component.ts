import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RequestItem } from '../../core/request.models';
import { RequestService } from '../../core/request.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './request-list.component.html'
})
export class RequestListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  loading = false;
  error = '';
  requests: RequestItem[] = [];
  page = 1;
  pageSize = 10;
  totalCount = 0;

  filterForm = this.fb.nonNullable.group({
    status: [''],
    priority: [''],
    deadlineFrom: [''],
    deadlineTo: [''],
    titleSearch: ['', [Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9\s\-_]*$/)]],
    page: [1],
    pageSize: [10]
  });

  constructor(private readonly service: RequestService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    if (this.filterForm.invalid) {
      this.error = 'Please fix filter input values.';
      return;
    }

    this.loading = true;
    this.error = '';
    const raw = this.filterForm.getRawValue() as Record<string, string | number>;
    const filters: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const text = String(value ?? '').trim();
      if (text !== '') {
        if (key === 'deadlineFrom') {
          filters[key] = new Date(`${text}T00:00:00`).toISOString();
        } else if (key === 'deadlineTo') {
          filters[key] = new Date(`${text}T23:59:59.999`).toISOString();
        } else {
          filters[key] = text;
        }
      }
    }
    this.service.getAll(filters)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: data => {
          this.requests = data.items;
          this.page = data.page;
          this.pageSize = data.pageSize;
          this.totalCount = data.totalCount;
        },
        error: () => (this.error = 'Failed to load requests.')
      });
  }

  applyFilters() {
    this.filterForm.patchValue({ page: 1 });
    this.load();
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
}
