import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';



@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {

  name = '';
  email = '';
  password = '';
  role = 'user';
  city = '';
  address = '';
  providerService = '';
  error = '';
  providerServices = [
    'Home Cleaning',
    'Plumbing',
    'Electrical',
    'Appliance Repair'
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadProviderServices();
  }

  loadProviderServices() {
    this.http.get<any[]>('https://sms-backend-jeel.onrender.com/api/services').subscribe({
      next: (res) => {
        const names = (Array.isArray(res) ? res : [])
          .map(item => String(item?.name || '').trim())
          .filter(Boolean);

        if (names.length > 0) {
          this.providerServices = Array.from(new Set(names));
        }
      }
    });
  }

  register() {
    if (!this.city.trim()) {
      this.error = 'City is required';
      return;
    }

    if (this.role === 'provider' && !this.providerService) {
      this.error = 'Please choose your service';
      return;
    }

    const payload: any = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      city: this.city.trim(),
      address: this.role === 'user' ? this.address : ''
    };

    if (this.role === 'provider') {
      payload.providerService = this.providerService;
    }

    this.auth.register({
      ...payload
    }).subscribe({
    next: (res: any) => {
      alert('Verification code sent!');
      this.router.navigate(['/auth/verify-account'], {
        queryParams: { email: this.email.trim().toLowerCase() }
      });
    },
    error: (err) => {
      // Add this log to see the REAL issue
      console.log("🛑 Backend Error Details:", err.error); 
      this.error = err.error.message || 'Registration failed';
    }
  });
  }
  goLogin() {
    this.router.navigate(['/auth/login']);
  }

}
