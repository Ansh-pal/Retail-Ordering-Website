import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Category {
  id: number;
  name: string;
  description?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = `${environment.apiUrl}/category`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Extract token from localStorage and create Authorization Bearer header
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all categories with authorization
   */
  getAllCategories(): Observable<Category[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Category[]>(
      this.baseUrl,
      { headers }
    );
  }
}