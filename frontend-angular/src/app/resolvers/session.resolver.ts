import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

export const sessionResolver: ResolveFn<boolean> = () => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get('https://sms-backend-jeel.onrender.com/api/users/me', { withCredentials: true }).pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};
