import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";

import {
  AuthRequest,
  AuthResponse,
  MfaVerifyRequest,
  RegisterRequest,
} from "../models/auth.model";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = "/api/auth";
  private readonly tokenKey = "neo4flix.token";

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.saveTokenIfAuthenticated(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap((response) => this.saveTokenIfAuthenticated(response)));
  }

  verifyMfa(request: MfaVerifyRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/mfa/verify`, request)
      .pipe(tap((response) => this.saveTokenIfAuthenticated(response)));
  }

  updateAccessToken(token: string): void {
    this.saveToken(token);
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

  private saveTokenIfAuthenticated(response: AuthResponse): void {
    if (!response.mfaRequired && response.accessToken) {
      this.saveToken(response.accessToken);
    }
  }

  private saveToken(token: string): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
  }
}
