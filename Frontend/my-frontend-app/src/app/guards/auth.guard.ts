import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      const allowedRoles = route.data['roles'] as string[] | undefined;
      if (!allowedRoles || allowedRoles.length === 0) {
        return true;
      }

      if (this.authService.hasRole(allowedRoles)) {
        return true;
      }

      this.router.navigate(['/landing']);
      return false;
    }

    this.router.navigate(['/login']);
    return false;
  }
}