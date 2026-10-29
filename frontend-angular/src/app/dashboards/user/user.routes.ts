import { Routes } from '@angular/router';
import { UserLayoutComponent } from './layout/user-layout';
import { browserReadyGuard } from '../../guards/browser-ready.guard';
import { TokenReadyGuard } from '../../guards/token-ready.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    canActivate: [browserReadyGuard],
    children: [
      { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'help', loadComponent: () => import('./pages/help-center/help-center.component').then(m => m.HelpCenterComponent) },

      { path: 'bookings', loadComponent: () => import('./pages/my-bookings/my-bookings').then(m => m.MyBookingsComponent) },

      { path: 'profile', canActivate: [TokenReadyGuard], loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent) },
      { path: 'book', canActivate: [TokenReadyGuard], loadComponent: () => import('./pages/book-service/book-service').then(m => m.BookServiceComponent) },
      { path: 'dashboard', canActivate: [TokenReadyGuard], loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.UserDashboardComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
