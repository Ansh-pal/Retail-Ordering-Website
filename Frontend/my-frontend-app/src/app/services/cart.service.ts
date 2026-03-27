import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CartItem {
  productId: number;
  quantity: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = `${environment.apiUrl}/cart`;

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