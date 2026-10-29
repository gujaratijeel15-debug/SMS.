import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TokenReadyGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    const token = localStorage.getItem('token');

    // ✅ Define public routes
    const publicRoutes = [
      '/',
      '/home',
      '/about',
      '/contact',
      '/help',
      '/auth/login',
      '/auth/register'
    ];

    // ✅ If route is public → allow
    if (publicRoutes.includes(state.url)) {
      return true;
    }

    // ✅ If token exists → allow
    if (token) {
      return true;
    }

    // ❌ Otherwise redirect
    this.router.navigate(['/auth/login']);
    return false;
  }
}
