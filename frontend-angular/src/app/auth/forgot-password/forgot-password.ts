import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {

  email = '';
  message = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, public router: Router) {}
  sendOTP() {
    if (!this.email || !this.email.includes('@')) {
      this.error = 'Please enter a valid email';
      return;
    }
    
    this.error = '';
    this.message = '';
    this.loading = true;

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        const targetEmail = this.email.trim();
        this.message = 'OTP sent to your email';
        this.loading = false;
        this.router.navigate(['/auth/verify-otp'], {
          queryParams: { email: targetEmail }
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to send OTP';
        this.loading = false;
      }
    });
  }
}
