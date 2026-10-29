import { Routes } from '@angular/router';
// import { ForgotPasswordComponent } from './forgot-password/forgot-password';
import { AuthLayoutComponent } from '../layouts/auth-layout/auth-layout.component';





export const AUTH_ROUTES: Routes = [
// { path: 'forgot-password', component: ForgotPasswordComponent },
{ path: '', redirectTo: 'login', pathMatch: 'full' },
{
    path: '',
    component: AuthLayoutComponent,
    children: [

      {
        path: 'register',
        loadComponent: () =>
          import('./register/register').then(m => m.RegisterComponent),
             data: {
          title: 'Create Your Account',
          subtitle: 'Register to book and manage home services',
          image: 'assets/auth/6.jpg'
        }
    },

      {
        path: 'login',
        loadComponent: () =>
          import('./login/login').then(m => m.LoginComponent),
             data: {
          title: 'Sign In',
          subtitle: 'Access your account',
          image: 'assets/auth/1.jpg'
        }
    },

      {
        path: 'verify-account',
        loadComponent: () =>
          import('./verify-account/verify-account').then(m => m.VerifyAccountComponent),
             data: {
          title: 'Verify Account',
          subtitle: 'Confirm your account details',
          image: 'assets/auth/2.jpg'
        }
      },

      {
        path: 'verify-otp',
        loadComponent: () =>
          import('./verify-otp/verify-otp').then(m => m.VerifyOtpComponent),
         data: {
          title: 'Secure Your Account',
          subtitle: 'Reset your password safely',
          image: 'assets/auth/3.jpg'
        } 
    },

          {
        path: 'forgot-password',
        loadComponent: () =>
          import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
             data: {
          title: 'Forgot Password',
          subtitle: 'Reset your password',
          image: 'assets/auth/4.png'
        }
    },

      {
        path: 'reset-password',
        loadComponent: () =>
          import('./reset-password/reset-password').then(m => m.ResetPasswordComponent),
             data: {
          title: 'Secure Your Account',
          subtitle: 'Reset your password safely',
          image: 'assets/auth/5.jpg'
        }
    }

    ]
  }

  

];
