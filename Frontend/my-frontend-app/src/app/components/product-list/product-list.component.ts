import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';
  userRole: string = '';
  isAuthenticated: boolean = false;
  showAddModal: boolean = false;
  productForm!: FormGroup;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.syncAuthState();
    this.loadProducts();
    this.initProductForm();
  }

  private initProductForm(): void {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      categoryName: ['', Validators.required],
      isAvailable: [true, Validators.required]
    });
  }

  /**
   * Get user role from localStorage
   */
  private syncAuthState(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.userRole = this.authService.getUserRole() || 'Guest';
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
    if (!this.isAuthenticated) {
      this.promptLoginRedirect();
      return;
    }
    this.clearMessages();
    this.cartService.addToCart(productId, 1).subscribe({
      next: (response) => {
        this.successMessage = 'Product added to cart successfully!';
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        if (error.status === 401) {
          this.promptLoginRedirect();
          return;
        }
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
    return this.userRole?.trim().toLowerCase() === 'manager';
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private promptLoginRedirect(): void {
    this.errorMessage = 'Please login to add items to your cart.';
    setTimeout(() => this.clearMessages(), 3000);
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  openAddProductModal(): void {
    this.productForm.reset({
      name: '',
      price: 0,
      quantity: 0,
      categoryName: '',
      isAvailable: true
    });
    this.showAddModal = true;
  }

  closeAddProductModal(): void {
    this.showAddModal = false;
  }

  submitProduct(): void {
    if (this.productForm.invalid) {
      return;
    }

    const payload = {
      ...this.productForm.value,
      isAvailable: !!this.productForm.value.isAvailable
    };

    this.productService.addProduct(payload).subscribe({
      next: (createdProduct: Product) => {
        this.products = [createdProduct, ...this.products];
        this.successMessage = 'Product added successfully!';
        this.closeAddProductModal();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.errorMessage = 'Failed to add product. Please try again.';
        console.error('Error adding product:', error);
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }
}
