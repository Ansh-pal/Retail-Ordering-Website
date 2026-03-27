import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CartItem {
  productId: number;
  quantity: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://localhost:5000/api/cart';

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
   * Add product to cart
   */
  addToCart(productId: number, quantity: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { productId, quantity };
    return this.http.post(
      `${this.baseUrl}/add`,
      body,
      { headers }
    );
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(productId: number, quantity: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { quantity };
    return this.http.put(
      `${this.baseUrl}/update/${productId}`,
      body,
      { headers }
    );
  }

  /**
   * Remove product from cart
   */
  removeFromCart(productId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(
      `${this.baseUrl}/remove/${productId}`,
      { headers }
    );
  }
}