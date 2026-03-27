import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private baseUrl = 'http://localhost:5000/api/product';

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with Bearer token from localStorage
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
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