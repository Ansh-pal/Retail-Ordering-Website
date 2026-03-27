import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
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
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly apiOrigin = new URL(environment.apiUrl).origin;
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token && (this.isSameOrigin(request.url) || this.isApiRequest(request.url))) {
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
          this.authService.logout();
          if (this.isBrowser) {
            this.router.navigate(['/login']);
          }
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
    if (!this.isBrowser) {
      return false;
    }
    // If URL is relative, it's same origin
    if (!url.startsWith('http')) {
      return true;
    }

    // Check if URL starts with current origin
    const currentOrigin = window.location.origin;
    return url.startsWith(currentOrigin);
  }

  private isApiRequest(url: string): boolean {
    try {
      const target = new URL(url);
      return target.origin === this.apiOrigin;
    } catch {
      return false;
    }
  }
}