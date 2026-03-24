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
}
