import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

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
  allProducts: Product[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProductsForCart();
  }

  /**
   * Load all products and enrich cart items with product details
   */
  loadProductsForCart(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe({
      next: (products: Product[]) => {
        this.allProducts = products;
        this.enrichCartItems();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load product details. Please try again.';
        console.error('Error loading products:', error);
      }
    });
  }

  /**
   * Enrich cart items with product details
   */
  private enrichCartItems(): void {
    // Sample cart items - in real app, this would come from a cart service endpoint
    // or stored in a service that maintains cart state across navigation
    this.cartItems = this.cartItems.map(item => {
      const product = this.allProducts.find(p => p.id === item.productId);
      return {
        ...item,
        product
      };
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
        // Update local cart items
        const cartItem = this.cartItems.find(item => item.productId === productId);
        if (cartItem) {
          cartItem.quantity = newQuantity;
        }
        this.successMessage = 'Quantity updated successfully!';
        setTimeout(() => this.clearMessages(), 2000);
      },
      error: (error) => {
        this.errorMessage = 'Failed to update quantity. Please try again.';
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
        // Remove from local cart items
        this.cartItems = this.cartItems.filter(item => item.productId !== productId);
        this.successMessage = 'Item removed from cart!';
        setTimeout(() => this.clearMessages(), 2000);
      },
      error: (error) => {
        this.errorMessage = 'Failed to remove item. Please try again.';
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

    this.successMessage = 'Proceeding with order placement...';
    console.log('Order details:', this.cartItems);

    // Navigate to checkout/order page after a delay
    setTimeout(() => {
      this.router.navigate(['/order-summary']);
    }, 1500);
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
}