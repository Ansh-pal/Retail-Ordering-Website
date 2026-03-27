import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    // Check if URL is same origin (CORS handling)
    if (token && this.isSameOrigin(request.url)) {
      // Clone request and add Authorization header with Bearer token
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Pass request through and handle response
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized response
        if (error.status === 401) {
          // Clear localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');

          // Navigate to login page
          this.router.navigate(['/login']);
        }

        // Return error
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if URL is same origin to handle CORS
   */
  private isSameOrigin(url: string): boolean {
    // If URL is relative, it's same origin
    if (!url.startsWith('http')) {
      return true;
    }

    // Check if URL starts with current origin
    const currentOrigin = window.location.origin;
    return url.startsWith(currentOrigin);
  }
}