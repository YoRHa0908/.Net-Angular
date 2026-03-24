import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = 'http://localhost:5000/api/auth';
  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly role = signal<string | null>(localStorage.getItem('role'));
  readonly email = signal<string | null>(localStorage.getItem('email'));

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.api}/login`, payload).pipe(
      tap(res => this.saveAuth(res))
    );
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.api}/register`, payload).pipe(
      tap(res => this.saveAuth(res))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.token.set(null);
    this.role.set(null);
    this.email.set(null);
  }

  private saveAuth(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('role', res.role);
    localStorage.setItem('email', res.email);
    this.token.set(res.token);
    this.role.set(res.role);
    this.email.set(res.email);
  }

  getUserId(): string | null {
    const token = this.token();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payloadRaw = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadRaw) as { sub?: string; nameid?: string };
      return payload.sub ?? payload.nameid ?? null;
    } catch {
      return null;
    }
  }

  /** Manager/admin: from stored role or JWT role claims (ASP.NET uses long claim type in payload). */
  isManager(): boolean {
    const stored = this.role();
    if (stored && stored.toLowerCase() === 'manager') return true;

    const token = this.token();
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      const payloadRaw = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
      const roleClaim =
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      const fromJwt: string[] = [];
      const push = (v: unknown) => {
        if (typeof v === 'string') fromJwt.push(v);
        else if (Array.isArray(v)) v.forEach(x => fromJwt.push(String(x)));
      };
      push(payload['role']);
      push(payload['roles']);
      push(payload[roleClaim]);
      return fromJwt.some(r => r.toLowerCase() === 'manager');
    } catch {
      return false;
    }
  }
}
