import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isAuthenticated: boolean = false;
  userName: string = '';
  userRole: string = '';
  showMobileMenu: boolean = false;
  private readonly isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.checkAuthStatus();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.checkAuthStatus());
  }

  /**
   * Check if user is authenticated
   */
  private checkAuthStatus(): void {
    if (!this.isBrowser) {
      this.isAuthenticated = false;
      return;
    }
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userName = this.authService.getUserName() || 'User';
      this.userRole = this.authService.getUserRole();
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.closeMobileMenu();
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigate to home/landing
   */
  goToHome(): void {
    this.closeMobileMenu();
    this.router.navigate(['/landing']);
  }

  /**
   * Navigate to login
   */
  goToLogin(): void {
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to register
   */
  goToRegister(): void {
    this.closeMobileMenu();
    this.router.navigate(['/register']);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.isAuthenticated = false;
    this.closeMobileMenu();
  }
}
