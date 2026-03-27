import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService, Product, CreateProductRequest } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';
  userRole: string = '';
  selectedCategoryId: string = '';
  productForm!: FormGroup;
  categoryForm!: FormGroup;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private categoryService: CategoryService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.getUserRole();
    this.initializeForms();
    this.loadCategories();
    this.loadProducts();
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
        this.errorMessage = this.mapHttpError(error, 'Failed to load products.');
        console.error('Error loading products:', error);
      }
    });
  }

  filterByCategory(): void {
    if (!this.selectedCategoryId) {
      this.loadProducts();
      return;
    }

    this.isLoading = true;
    const categoryId = Number(this.selectedCategoryId);
    this.productService.getProductsByCategory(categoryId).subscribe({
      next: (response: Product[]) => {
        this.products = response;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.mapHttpError(error, 'Failed to filter products by category.');
      }
    });
  }

  onCategoryFilterChange(value: string): void {
    this.selectedCategoryId = value;
    this.filterByCategory();
  }

  /**
   * Add product to cart
   */
  addToCart(productId: number): void {
    if (this.isManager()) {
      this.errorMessage = 'Only users can add items to cart.';
      return;
    }

    this.clearMessages();
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        this.successMessage = 'Product added to cart successfully!';
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error) => {
        this.errorMessage = this.mapHttpError(error, 'Failed to add product to cart.');
        console.error('Error adding to cart:', error);
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
        this.loadProducts();
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
        // Remove product from array
        this.products = this.products.filter(p => p.id !== productId);
        this.successMessage = 'Product deleted successfully!';
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
