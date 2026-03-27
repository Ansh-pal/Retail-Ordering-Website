import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category {
  id: number;
  name: string;
  [key: string]: any;
}

export interface CreateCategoryRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = `${environment.apiUrl}/category`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/category
   */
  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }

  /**
   * POST /api/category (Manager only)
   */
  createCategory(data: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, data);
  }
}