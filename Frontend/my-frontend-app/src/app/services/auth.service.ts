import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userRole: string;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getStorageItem(key: string): string {
    return this.isBrowser ? localStorage.getItem(key) || '' : '';
  }

  private setStorageItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private removeStorageItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data);
  }

  logout(): void {
    this.removeStorageItem('authToken');
    this.removeStorageItem('userRole');
    this.removeStorageItem('userName');
    this.router.navigate(['/login']);
  }

  getToken(): string {
    return this.getStorageItem('authToken');
  }

  setToken(token: string): void {
    this.setStorageItem('authToken', token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string {
    return this.getStorageItem('userRole');
  }

  setUserRole(role: string): void {
    if (!role) {
      this.removeStorageItem('userRole');
      return;
    }
    this.setStorageItem('userRole', role);
  }

  getUserName(): string {
    return this.getStorageItem('userName');
  }

  setUserName(name: string): void {
    if (!name) {
      this.removeStorageItem('userName');
      return;
    }
    this.setStorageItem('userName', name);
  }
}