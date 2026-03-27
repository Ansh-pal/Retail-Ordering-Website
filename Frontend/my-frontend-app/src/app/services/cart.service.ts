import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItem {
  productId: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
    quantity?: number;
    isAvailable?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/cart (User only)
   */
  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(this.baseUrl);
  }

  /**
   * POST /api/cart/add (User only)
   */
  addToCart(productId: number, quantity: number): Observable<any> {
    const body = { productId, quantity };
    return this.http.post(`${this.baseUrl}/add`, body);
  }

  /**
   * PUT /api/cart/update/{productId} (User only)
   */
  updateCartItem(productId: number, quantity: number): Observable<any> {
    const body = { quantity };
    return this.http.put(`${this.baseUrl}/update/${productId}`, body);
  }

  /**
   * DELETE /api/cart/remove/{productId} (User only)
   */
  removeFromCart(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/remove/${productId}`);
  }
}