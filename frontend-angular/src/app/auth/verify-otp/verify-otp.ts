import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html'
})
export class VerifyOtpComponent {
  email = '';
  otp = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.email = String(this.route.snapshot.queryParams['email'] || '').trim();
  }

  verify() {
    if (!this.email || !this.otp) {
      this.error = 'Email and OTP are required';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { email: this.email, otp: this.otp }
        });
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'OTP verification failed';
      }
    });
  }
}
