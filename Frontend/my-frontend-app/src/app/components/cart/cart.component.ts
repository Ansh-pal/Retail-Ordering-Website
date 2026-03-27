import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../services/product.service';
import { CartService, CartItem as ServiceCartItem } from '../../services/cart.service';
import { OrderService, OrderSummary, OrderItem } from '../../services/order.service';

export interface CartItem {
  productId: number;
  quantity: number;
  product?: Product;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoading: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';
  orders: OrderSummary[] = [];
  selectedOrderId: number | null = null;
  selectedOrder: OrderSummary | null = null;
  selectedOrderItems: OrderItem[] = [];
  userRole: string = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole') || '';
    if (this.userRole !== 'User') {
      this.isLoading = false;
      this.errorMessage = 'Cart is available only for users.';
      return;
    }

    this.loadCart();
    this.loadOrders();
  }

  /**
   * Load cart using GET /api/cart
   */
  loadCart(): void {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: (items: ServiceCartItem[]) => {
        this.cartItems = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          product: item.product as Product | undefined
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.mapHttpError(error, 'Failed to load cart.');
        console.error('Error loading cart:', error);
      }
    });
  }

  /**
   * Update item quantity in cart
   */
  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.clearMessages();
    this.cartService.updateCartItem(productId, newQuantity).subscribe({
      next: () => {
        const cartItem = this.cartItems.find(item => item.productId === productId);
        if (cartItem) {
          cartItem.quantity = newQuantity;
        }
        this.successMessage = 'Quantity updated successfully!';
        setTimeout(() => this.clearMessages(), 2000);
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to update quantity.');
        console.error('Error updating quantity:', error);
        setTimeout(() => this.clearMessages(), 2000);
      }
    });
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: number): void {
    this.clearMessages();
    this.cartService.removeFromCart(productId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(item => item.productId !== productId);
        this.successMessage = 'Item removed from cart!';
        setTimeout(() => this.clearMessages(), 2000);
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to remove item.');
        console.error('Error removing item:', error);
        setTimeout(() => this.clearMessages(), 2000);
      }
    });
  }

  /**
   * Calculate subtotal for a single item
   */
  getSubtotal(item: CartItem): number {
    if (item.product) {
      return item.product.price * item.quantity;
    }
    return 0;
  }

  /**
   * Calculate total cart amount
   */
  calculateTotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + this.getSubtotal(item);
    }, 0);
  }

  /**
   * Proceed to checkout
   */
  checkout(): void {
    if (this.cartItems.length === 0) {
      this.errorMessage = 'Cart is empty. Please add items before checkout.';
      return;
    }

    this.clearMessages();
    this.orderService.placeOrder().subscribe({
      next: () => {
        this.successMessage = 'Order placed successfully!';
        this.loadCart();
        this.loadOrders();
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to place order.');
      }
    });
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (orders: OrderSummary[]) => {
        this.orders = orders;
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to fetch orders.');
      }
    });
  }

  getOrderDetails(orderIdInput: string): void {
    const orderId = Number(orderIdInput);
    if (!orderId) {
      this.errorMessage = 'Enter a valid order ID.';
      return;
    }

    this.selectedOrderId = orderId;
    this.orderService.getOrderById(orderId).subscribe({
      next: (order: OrderSummary) => {
        this.selectedOrder = order;
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to fetch order details.');
      }
    });
  }

  getOrderItems(orderIdInput: string): void {
    const orderId = Number(orderIdInput);
    if (!orderId) {
      this.errorMessage = 'Enter a valid order ID.';
      return;
    }

    this.selectedOrderId = orderId;
    this.orderService.getOrderItems(orderId).subscribe({
      next: (items: OrderItem[]) => {
        this.selectedOrderItems = items;
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to fetch order items.');
      }
    });
  }

  /**
   * Increment quantity
   */
  incrementQuantity(item: CartItem): void {
    this.updateQuantity(item.productId, item.quantity + 1);
  }

  /**
   * Decrement quantity
   */
  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateQuantity(item.productId, item.quantity - 1);
    }
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private mapHttpError(error: any, fallback: string): string {
    switch (error?.status) {
      case 400:
        return error.error?.message || 'Invalid request payload.';
      case 401:
        return 'You are not authenticated. Please login again.';
      case 403:
        return 'You are not authorized for this action.';
      case 404:
        return 'Requested resource was not found.';
      default:
        return error.error?.message || fallback;
    }
  }
}