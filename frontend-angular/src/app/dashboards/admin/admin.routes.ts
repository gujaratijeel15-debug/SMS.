import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout';

export const ADMIN_ROUTES: Routes = [

  {
    path: '',
    component: AdminLayoutComponent,
    children: [

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard')
            .then(m => m.AdminDashboardComponent)
      },

      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/manage-users')
            .then(m => m.AdminManageUsersComponent)
      },

      {
        path: 'providers',
        loadComponent: () =>
          import('./pages/providers/manage-providers')
            .then(m => m.AdminManageProvidersComponent)
      },

      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/messages/manage-messages')
            .then(m => m.AdminManageMessagesComponent)
      },

      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/reviews/provider-reviews')
            .then(m => m.AdminProviderReviewsComponent)
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/services/manage-services')
            .then(m => m.AdminManageServicesComponent)
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/action-history/action-history')
            .then(m => m.AdminActionHistoryComponent)
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }

    ]
  }

];
