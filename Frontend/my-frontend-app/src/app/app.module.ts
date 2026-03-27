import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';

/**
 * NOTE: This module is not currently used in your application.
 * Your project uses standalone components with bootstrapApplication() in main.ts,
 * and HttpClient + AuthInterceptor are already provided in app.config.ts.
 * 
 * This file is provided for reference or if you decide to migrate to NgModule-based architecture.
 */
@NgModule({
  imports: [
    HttpClientModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class AppModule { }
