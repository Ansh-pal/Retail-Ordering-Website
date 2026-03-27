import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
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
  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);

  // Shared cart stream for components to use with async pipe.
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getJsonAuthHeaders(): HttpHeaders {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headersConfig: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headersConfig);
  }

  /**
   * GET /api/cart (User only)
   */
  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(this.baseUrl).pipe(
      tap((items) => this.cartItemsSubject.next(items))
    );
  }

  refreshCart(): Observable<CartItem[]> {
    return this.getCart();
  }

  getCurrentCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  /**
   * POST /api/cart/add (User only)
   */
  addToCart(productId: number, quantity: number): Observable<any> {
    // Guard against undefined/invalid values before making the request.
    if (productId == null || !Number.isFinite(productId) || productId <= 0) {
      throw new Error('Invalid productId. Cannot call addToCart API.');
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Invalid quantity. Cannot call addToCart API.');
    }

    const body = { productId, quantity };
    const headers = this.getJsonAuthHeaders();

    console.log('CartService POST /cart/add body:', body);

    return this.http.post(`${this.baseUrl}/add`, body, { headers }).pipe(
      switchMap(() => this.getCart())
    );
  }

  /**
   * PUT /api/cart/update/{productId} (User only)
   */
  updateCartItem(productId: number, quantity: number): Observable<any> {
    const body = { quantity };
    return this.http.put(`${this.baseUrl}/update/${productId}`, body).pipe(
      switchMap(() => this.getCart())
    );
  }

  /**
   * DELETE /api/cart/remove/{productId} (User only)
   */
  removeFromCart(productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/remove/${productId}`).pipe(
      switchMap(() => this.getCart())
    );
  }
}