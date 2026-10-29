import { Routes } from '@angular/router';
import { ProviderLayoutComponent } from './layout/provider-layout';
import { RoleGuard } from '../../guards/role.guard';

export const PROVIDER_ROUTES: Routes = [

  {
    path: '',
    component: ProviderLayoutComponent,
    
    // only provider role allowed
    canActivate: [RoleGuard],
    data: { role: 'provider' },

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard')
            .then(m => m.ProviderDashboardComponent)
      },

      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests')
            .then(m => m.ProviderRequestsComponent)
      },

      {
        path: 'active-jobs',
        loadComponent: () =>
          import('./pages/active-jobs/active-jobs')
            .then(m => m.ProviderActiveJobsComponent)
      },
{
  path: 'home',
  loadComponent: () =>
    import('./pages/provider-home/provider-home').then(m => m.ProviderHomeComponent)
},

      {
        path: 'earnings',
        loadComponent: () =>
          import('./pages/earnings/earnings')
            .then(m => m.ProviderEarningsComponent)
      },

      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile')
            .then(m => m.ProviderProfileComponent)
      },

      {
        path: 'about',
        loadComponent: () =>
          import('./pages/about/about.component')
            .then(m => m.ProviderAboutComponent)
      },

      {
        path: 'help',
        loadComponent: () =>
          import('./pages/help-center/help-center.component')
            .then(m => m.ProviderHelpCenterComponent)
      }

    ]
  },

  {
  path: 'history',
  loadComponent: () =>
    import('./pages/history/history')
      .then(m => m.ProviderHistoryComponent)
}
];
