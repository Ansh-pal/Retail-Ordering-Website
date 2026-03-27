import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  categoryId?: number;
  categoryName?: string;
  isAvailable: boolean;
  [key: string]: any;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  categoryId: number;
  quantity: number;
  isAvailable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = `${environment.apiUrl}/product`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/product
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  /**
   * GET /api/product/category/{categoryId}
   */
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/category/${categoryId}`);
  }

  /**
   * POST /api/product (Manager only)
   */
  addProduct(data: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, data);
  }

  /**
   * DELETE /api/product/{id} (Manager only)
   */
  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}