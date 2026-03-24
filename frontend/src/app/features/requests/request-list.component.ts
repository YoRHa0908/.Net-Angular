import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
    titleSearch: [''],
    page: [1],
    pageSize: [10]
  });

  constructor(private readonly service: RequestService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    const raw = this.filterForm.getRawValue() as Record<string, string | number>;
    const filters: Record<string, string> = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, String(v ?? '')])
    );
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
}
