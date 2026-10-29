import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const role = String(localStorage.getItem('role') || '').trim().toLowerCase();
    const expectedRole = String(route.data['role'] || '').trim().toLowerCase();

    if (role && role === expectedRole) {
      return true;
    }

    return this.router.parseUrl('/home');
  }

}
