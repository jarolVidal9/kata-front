import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        router.navigate(['/auth/login']);
      }

      // Formatear el error para el componente
      const errorMessage = error.error?.message || 'Ha ocurrido un error';
      return throwError(() => ({ message: errorMessage }));
    })
  );
};
