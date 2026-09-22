import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Inyecta el ID token de Firebase como `Authorization: Bearer <token>` en cualquier
 * request HttpClient saliente. Hoy no hay endpoints REST propios (Auth y Firestore se
 * consumen vía el SDK de Firebase), pero queda listo para cualquier API adicional.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return from(authService.getIdToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }
      const authorizedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authorizedReq);
    }),
  );
};
