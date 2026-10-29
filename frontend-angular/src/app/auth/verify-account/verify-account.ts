import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-account.html'
})
export class VerifyAccountComponent {
  email = '';
  otp = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.email = String(this.route.snapshot.queryParams['email'] || '').trim().toLowerCase();
  }

  verify() {
    this.auth.verifyAccount(this.email, this.otp).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: err => this.error = err.error.message
    });
  }
}
