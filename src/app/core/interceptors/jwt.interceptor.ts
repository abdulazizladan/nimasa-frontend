import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { ROUTES } from '../routes';

/** Attaches the JWT to every request; a 401 ends the session and returns to the login page. */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private auth = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();
    if (token) {
      request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !request.url.endsWith('/auth/login')) {
          this.auth.logout();
          this.router.navigateByUrl(ROUTES.login);
        }
        return throwError(() => error);
      })
    );
  }
}
