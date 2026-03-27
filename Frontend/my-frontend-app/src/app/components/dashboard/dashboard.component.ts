import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductListComponent } from '../product-list/product-list.component';
import { CartComponent } from '../cart/cart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ProductListComponent, CartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  showProductList: boolean = true;
  userName: string = '';
  isAuthenticated: boolean = false;
  authWarning: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.syncAuthState();
  }

  /**
   * Handle logout
   */
  logout(): void {
    this.authService.logout();
    this.syncAuthState();
    this.showProducts();
  }

  private syncAuthState(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userRole = this.authService.getUserRole() || 'User';
      this.userName = this.authService.getUserName() || 'User';
    } else {
      this.userRole = 'Guest';
      this.userName = 'Guest';
    }
  }

  /**
   * Show products view
   */
  showProducts(): void {
    this.showProductList = true;
    this.authWarning = '';
  }

  /**
   * Show cart view
   */
  showCart(): void {
    if (!this.isAuthenticated) {
      this.authWarning = 'Please login to view and manage your cart.';
      this.router.navigate(['/login']);
      setTimeout(() => (this.authWarning = ''), 4000);
      return;
    }
    this.showProductList = false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}