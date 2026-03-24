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
    const hr = error as { error?: unknown; message?: string };

    const fromBody = this.messageFromResponseBody(hr.error);
    if (fromBody) return fromBody;

    if (typeof hr.message === 'string' && hr.message.trim()) {
      return hr.message.trim();
    }

    return null;
  }

  /** ASP.NET: plain string, string[], ValidationProblemDetails `errors`, or ProblemDetails `detail`. */
  private messageFromResponseBody(body: unknown): string | null {
    if (body == null) return null;

    if (typeof body === 'string') {
      const t = body.trim();
      return t || null;
    }

    if (Array.isArray(body)) {
      const parts = body.map(x => String(x).trim()).filter(Boolean);
      return parts.length ? parts.join(' ') : null;
    }

    if (typeof body !== 'object') return null;

    const o = body as Record<string, unknown>;

    const detail = o['detail'];
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }

    const errors = o['errors'];
    if (errors && typeof errors === 'object') {
      const msgs: string[] = [];
      for (const v of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          msgs.push(...v.map(x => String(x).trim()).filter(Boolean));
        } else if (typeof v === 'string' && v.trim()) {
          msgs.push(v.trim());
        }
      }
      if (msgs.length) return msgs.join(' ');
    }

    const title = o['title'];
    if (typeof title === 'string' && title.trim()) {
      return title.trim();
    }

    return null;
  }
}
