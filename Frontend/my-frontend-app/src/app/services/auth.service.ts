import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNo: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role?: string;
  userRole?: string;
  user?: {
    name?: string;
    [key: string]: unknown;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data);
  }

  setSession(response: AuthResponse): void {
    this.setToken(response.token);

    const resolvedRole = response.role || response.userRole || this.getRoleFromToken(response.token);
    if (resolvedRole) {
      localStorage.setItem('userRole', resolvedRole);
    }

    const resolvedName = response.user?.name || this.getNameFromToken(response.token);
    if (resolvedName) {
      localStorage.setItem('userName', resolvedName);
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    this.router.navigate(['/login']);
  }

  getToken(): string {
    if (!this.canUseStorage()) {
      return '';
    }

    return localStorage.getItem('authToken') || '';
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getRole(): string {
    if (!this.canUseStorage()) {
      return '';
    }

    return localStorage.getItem('userRole') || '';
  }

  // Backward-compatible alias used by older components.
  getUserRole(): string {
    return this.getRole();
  }

  getUserName(): string {
    if (!this.canUseStorage()) {
      return '';
    }

    return localStorage.getItem('userName') || '';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Backward-compatible alias used by older guard code.
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  hasRole(allowedRoles: string[]): boolean {
    return allowedRoles.includes(this.getRole());
  }

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private parseJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getRoleFromToken(token: string): string {
    const payload = this.parseJwtPayload(token);
    if (!payload) {
      return '';
    }

    const roleClaim =
      payload['role'] ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return typeof roleClaim === 'string' ? roleClaim : '';
  }

  private getNameFromToken(token: string): string {
    const payload = this.parseJwtPayload(token);
    if (!payload) {
      return '';
    }

    const nameClaim =
      payload['name'] ||
      payload['unique_name'] ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
    return typeof nameClaim === 'string' ? nameClaim : '';
  }
}