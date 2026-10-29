import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';
import { ContactComponent } from './dashboards/user/pages/contact/contact.component';
import { AboutComponent } from './dashboards/user/pages/about/about.component';
import { HomeComponent } from './dashboards/user/pages/home/home.component';
import { BookServiceComponent } from './dashboards/user/pages/book-service/book-service';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./dashboards/user/pages/home/home.component').then(m => m.HomeComponent)
  },

  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  },

  {
    path: 'help',
    loadComponent: () =>
      import('./dashboards/user/pages/help-center/help-center.component').then(m => m.HelpCenterComponent)
  },

    {
    path: 'book',
    component: BookServiceComponent
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  {
    path: 'user',
    canActivate: [RoleGuard],
    data: { role: 'user' },
    loadChildren: () =>
      import('./dashboards/user/user.routes').then(m => m.USER_ROUTES)
  },

  {
  path: 'provider',
  canActivate: [RoleGuard],
  data: { role: 'provider' },
  loadChildren: () =>
    import('./dashboards/provider/provider.routes')
      .then(m => m.PROVIDER_ROUTES)
},

  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { role: 'admin' },
    loadChildren: () =>
      import('./dashboards/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },



];
