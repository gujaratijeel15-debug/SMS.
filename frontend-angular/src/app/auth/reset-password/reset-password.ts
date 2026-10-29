import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent {
email = '';
otp = '';
password = '';
error = '';
message = '';
loading = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {
    this.email = String(this.route.snapshot.queryParams['email'] || '').trim();
    this.otp = String(this.route.snapshot.queryParams['otp'] || '').trim();
  }

reset() {
  if (!this.email || !this.otp || !this.password) {
    this.error = "All fields required";
    return;
  }

  this.loading = true;
  this.error = '';
  this.message = '';

  this.auth.resetPassword({
    email: this.email,
    otp: this.otp,
    newPassword: this.password
  }).subscribe({
    next: () => {
      this.loading = false;
      this.message = "Password reset successful";
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 1000);
    },
    error: (err) => {
      this.loading = false;
      this.error = err.error?.message || "Reset failed";
    }
  });
}

}
