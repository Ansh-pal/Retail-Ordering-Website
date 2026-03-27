import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService, Product, CreateProductRequest } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CategoryService, Category } from '../../services/category.service';
import { BehaviorSubject, Observable, catchError, debounceTime, distinctUntilChanged, of, shareReplay, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  categories: Category[] = [];
  isLoading: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';
  userRole: string = '';
  selectedCategoryId: string = '';
  productForm!: FormGroup;
  categoryForm!: FormGroup;
  products$!: Observable<Product[]>;
  private readonly categoryFilter$ = new BehaviorSubject<string>('');

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.getUserRole();
    this.initializeForms();
    this.initializeProductsStream();
    this.loadCategories();
    this.refreshProducts();
  }

  /**
   * Get user role from localStorage
   */
  private getUserRole(): void {
    this.userRole = localStorage.getItem('userRole') || '';
  }

  private initializeForms(): void {
    this.productForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      isAvailable: [true]
    });

    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required]]
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response: Category[]) => {
        this.categories = response;
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to load categories.');
      }
    });
  }

  private initializeProductsStream(): void {
    // Debounce quick filter changes and cancel previous request with switchMap.
    this.products$ = this.categoryFilter$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.isLoading = true;
      }),
      switchMap((categoryId) => {
        const request$ = categoryId
          ? this.productService.getProductsByCategory(Number(categoryId))
          : this.productService.getAllProducts();

        return request$.pipe(
          catchError((error) => {
            this.errorMessage = this.mapHttpError(error, 'Failed to load products.');
            return of([] as Product[]);
          })
        );
      }),
      tap(() => {
        this.isLoading = false;
      }),
      // Share one API response for all template bindings.
      shareReplay(1)
    );
  }

  private refreshProducts(): void {
    this.categoryFilter$.next(this.selectedCategoryId);
  }

  onCategoryFilterChange(value: string): void {
    this.selectedCategoryId = value;
    this.refreshProducts();
  }

  /**
   * Add product to cart
   */
  addToCart(product: Product): void {
    if (this.isManager()) {
      this.errorMessage = 'Only users can add items to cart.';
      return;
    }

    // Prevent avoidable 400 calls when item is not available in stock.
    if (!product.isAvailable || product.quantity <= 0) {
      this.errorMessage = 'This product is currently out of stock.';
      return;
    }

    const productId = product.id;

    // Validate before API call to prevent 400 from invalid payload.
    if (productId == null || !Number.isFinite(productId) || productId <= 0) {
      this.errorMessage = 'Invalid product selected. Please refresh and try again.';
      console.error('Invalid addToCart productId:', productId);
      return;
    }

    // Debug log helps verify exact values sent to backend.
    console.log('AddToCart request payload:', { productId, quantity: 1 });

    this.clearMessages();
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        this.successMessage = 'Product added to cart successfully!';
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        const backendMessage = this.extractBackendErrorMessage(error);

        if (backendMessage.toLowerCase().includes('exceeds available stock')) {
          this.errorMessage = 'Requested quantity exceeds available stock.';
        } else if (backendMessage) {
          this.errorMessage = backendMessage;
        } else {
          this.errorMessage = this.mapHttpError(error, 'Failed to add product to cart.');
        }

        // Log complete backend response for easier debugging.
        console.error('Error adding to cart (full response):', error);
        console.error('Backend specific error detail:', error?.error);
        setTimeout(() => this.clearMessages(), 3000);
      }
    });
  }

  addCategory(): void {
    if (!this.isManager()) {
      this.errorMessage = 'Only managers can create categories.';
      return;
    }

    if (this.categoryForm.invalid) {
      this.errorMessage = 'Category name is required.';
      return;
    }

    this.clearMessages();
    this.categoryService.createCategory(this.categoryForm.value).subscribe({
      next: () => {
        this.successMessage = 'Category created successfully!';
        this.categoryForm.reset();
        this.loadCategories();
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to create category.');
      }
    });
  }

  addProduct(): void {
    if (!this.isManager()) {
      this.errorMessage = 'Only managers can add products.';
      return;
    }

    if (this.productForm.invalid) {
      this.errorMessage = 'Fill all required product fields correctly.';
      return;
    }

    const payload: CreateProductRequest = {
      name: this.productForm.value.name,
      price: Number(this.productForm.value.price),
      categoryId: Number(this.productForm.value.categoryId),
      quantity: Number(this.productForm.value.quantity),
      isAvailable: Boolean(this.productForm.value.isAvailable)
    };

    this.clearMessages();
    this.productService.addProduct(payload).subscribe({
      next: () => {
        this.successMessage = 'Product added successfully!';
        this.productForm.reset({ isAvailable: true, price: 0, quantity: 1, categoryId: '' });
        this.refreshProducts();
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to add product.');
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
      next: () => {
        this.successMessage = 'Product deleted successfully!';
        this.refreshProducts();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to delete product.');
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

  private extractBackendErrorMessage(error: any): string {
    const backendError = error?.error;

    if (typeof backendError === 'string') {
      return backendError;
    }

    if (backendError && typeof backendError === 'object') {
      if (typeof backendError.message === 'string' && backendError.message.trim()) {
        return backendError.message;
      }

      if (typeof backendError.title === 'string' && backendError.title.trim()) {
        return backendError.title;
      }

      // ASP.NET validation responses often include an errors dictionary.
      if (backendError.errors && typeof backendError.errors === 'object') {
        const firstError = Object.values(backendError.errors)
          .flat()
          .find((value) => typeof value === 'string');

        if (typeof firstError === 'string') {
          return firstError;
        }
      }
    }

    return '';
  }

  private mapHttpError(error: any, fallback: string): string {
    switch (error?.status) {
      case 400:
        return error.error?.message || error.error?.title || 'Invalid request payload.';
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
