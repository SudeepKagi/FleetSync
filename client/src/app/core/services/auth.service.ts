/**
 * auth.service.ts: Manages user authentication state, reactive signals, tokens, and role checks.
 * Injected across: Guards, components, and layout.
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'fleet_manager' | 'driver';
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  // Angular Signals for reactive state
  private _user = signal<User | null>(this.loadUserFromStorage());
  private _token = signal<string | null>(localStorage.getItem('fleetsync_token'));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isFleetManager = computed(() => this._user()?.role === 'fleet_manager');
  readonly isDriver = computed(() => this._user()?.role === 'driver');
  readonly isManagerOrAdmin = computed(() =>
    this._user()?.role === 'admin' || this._user()?.role === 'fleet_manager'
  );

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password }).pipe(
      tap(response => {
        this.storeAuth(response.token, response.user);
      })
    );
  }

  register(data: { name: string; email: string; password: string; role?: string }): Observable<any> {
    return this.http.post(`${this.API}/register`, data);
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.API}/me`);
  }

  private storeAuth(token: string, user: User): void {
    localStorage.setItem('fleetsync_token', token);
    localStorage.setItem('fleetsync_user', JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('fleetsync_token');
    localStorage.removeItem('fleetsync_user');
    this._token.set(null);
    this._user.set(null);
  }

  private loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem('fleetsync_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this._user()?.role ?? '');
  }
}
