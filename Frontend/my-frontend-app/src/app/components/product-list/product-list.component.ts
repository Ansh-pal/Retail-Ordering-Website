import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';
  userRole: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.getUserRole();
    this.loadProducts();
  }

  /**
   * Get user role from localStorage
   */
  private getUserRole(): void {
    this.userRole = localStorage.getItem('userRole') || '';
  }

  /**
   * Load all products from service
   */
  private loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe({
      next: (response: Product[]) => {
        this.products = response;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load products. Please try again.';
        console.error('Error loading products:', error);
      }
    });
  }

  /**
   * Add product to cart
   */
  addToCart(productId: number): void {
    this.clearMessages();
    this.cartService.addToCart(productId, 1).subscribe({
      next: (response) => {
        this.successMessage = 'Product added to cart successfully!';
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.errorMessage = 'Failed to add product to cart. Please try again.';
        console.error('Error adding to cart:', error);
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  /**
   * Delete product (only for Manager role)
   */
  deleteProduct(productId: number): void {
    // Check if user is Manager
    if (this.userRole !== 'Manager') {
      this.errorMessage = 'You do not have permission to delete products.';
      setTimeout(() => this.clearMessages(), 3000);
      return;
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.clearMessages();
    this.productService.deleteProduct(productId).subscribe({
      next: (response) => {
        // Remove product from array
        this.products = this.products.filter(p => p.id !== productId);
        this.successMessage = 'Product deleted successfully!';
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.errorMessage = 'Failed to delete product. Please try again.';
        console.error('Error deleting product:', error);
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  /**
   * Check if user is Manager
   */
  isManager(): boolean {
    return this.userRole === 'Manager';
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
