import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  // 1. Get the token from browser storage
  const token = localStorage.getItem('token'); // ⚠️ Verify this key matches your local storage

  // Debugging: Let's see if the interceptor is running
  // console.log('Interceptor running for:', req.url);

  // 2. If token exists, clone the request and add the Header
  if (token) {
    // console.log('Adding token to request...');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` 
      }
    });
    return next(cloned);
  }

  // 3. If no token, just pass the request as is
  return next(req);
};