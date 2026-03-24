import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'error' | 'success' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  error(text: string) {
    this.push(text, 'error');
  }

  success(text: string) {
    this.push(text, 'success');
  }

  info(text: string) {
    this.push(text, 'info');
  }

  remove(id: number) {
    this.toasts.update(items => items.filter(x => x.id !== id));
  }

  httpError(error: unknown, fallback: string) {
    const text = this.extractMessage(error) ?? fallback;
    this.error(text);
  }

  private push(text: string, type: ToastMessage['type']) {
    const id = this.nextId++;
    this.toasts.update(items => [...items, { id, text, type }]);
    setTimeout(() => this.remove(id), 4000);
  }

  private extractMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;
    const maybeAny = error as any;

    if (typeof maybeAny.error === 'string' && maybeAny.error.trim()) {
      return maybeAny.error;
    }

    if (maybeAny.error && typeof maybeAny.error.detail === 'string' && maybeAny.error.detail.trim()) {
      return maybeAny.error.detail;
    }

    if (typeof maybeAny.message === 'string' && maybeAny.message.trim()) {
      return maybeAny.message;
    }

    return null;
  }
}
