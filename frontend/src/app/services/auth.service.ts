import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8082/api/auth';
  private readonly tokenKey = 'neo4flix.token';

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.saveToken(response.accessToken)));
  }

  register(request: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap((response) => this.saveToken(response.accessToken)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private saveToken(token: string): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
  }
}