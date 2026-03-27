import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderSummary {
  id: number;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/order`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/order/place (User only)
   */
  placeOrder(): Observable<any> {
    return this.http.post(`${this.baseUrl}/place`, {});
  }

  /**
   * GET /api/order (User only)
   */
  getOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(this.baseUrl);
  }

  /**
   * GET /api/order/{orderId} (User only)
   */
  getOrderById(orderId: number): Observable<OrderSummary> {
    return this.http.get<OrderSummary>(`${this.baseUrl}/${orderId}`);
  }

  /**
   * GET /api/order/{orderId}/items (User only)
   */
  getOrderItems(orderId: number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.baseUrl}/${orderId}/items`);
  }
}
