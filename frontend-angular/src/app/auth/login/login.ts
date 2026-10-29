import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { SessionService } from '../../services/session.service';
import { AuthStateService } from 'src/app/services/auth-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
})
export class LoginComponent {

  email = '';
  password = '';
  error = '';
  menuOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private session: SessionService,
    private authState: AuthStateService
  ) {}

  private extractRoleFromToken(token: string | null | undefined): string {
    if (!token) return '';

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return String(payload?.role || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }

  login() {
    this.error = '';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        const responseUser = res?.user || res?.data?.user || res?.data || res;
        const token =
          res?.token ||
          res?.accessToken ||
          res?.jwt ||
          res?.data?.token ||
          responseUser?.token ||
          '';

        const role = String(
          responseUser?.role ||
          res?.role ||
          res?.data?.role ||
          this.extractRoleFromToken(token)
        ).trim().toLowerCase();

        if (!token || !role) {
          this.error = 'Login response is incomplete. Please try again.';
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(responseUser));
        localStorage.setItem('role', role);

        this.authState.setRole(role);
        this.session.markReady();

        const target =
          role === 'admin' ? '/admin/dashboard' :
          role === 'provider' ? '/provider/home' :
          '/user/dashboard';

        // Use a hard redirect to avoid occasional router deadlocks after auth.
        window.location.assign(target);
      },
      error: err => {
        console.error(err);
        this.error = err.error?.message || 'Login failed';
      }
    });
  }

  goRegister() {
    this.router.navigate(['/auth/register']);
  }

  goForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
