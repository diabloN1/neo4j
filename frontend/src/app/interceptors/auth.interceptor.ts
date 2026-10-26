import { inject } from "@angular/core";
import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

import { AuthService } from "../services/auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();

  const isBackendRequest = /^https?:\/\/localhost(:\d+)?\//.test(req.url);

  const authenticatedRequest =
    token && isBackendRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      const isAuthRequest =
        req.url.includes("/api/auth/login") ||
        req.url.includes("/api/auth/register");

      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthRequest
      ) {
        authService.logout();

        if (!router.url.startsWith("/login")) {
          void router.navigate(["/login"]);
        }
      }

      return throwError(() => error);
    }),
  );
};
