import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = `${environment.apiUrl}/product`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get authorization headers with Bearer token from localStorage
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get all products
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  /**
   * Add a new product with authorization
   */
  addProduct(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(
      this.baseUrl,
      data,
      { headers }
    );
  }

  /**
   * Delete a product by ID with authorization
   */
  deleteProduct(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(
      `${this.baseUrl}/${id}`,
      { headers }
    );
  }
}