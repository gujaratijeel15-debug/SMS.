import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = 'http://localhost:5000/api/auth';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private isBrowser() {
    return isPlatformBrowser(this.platformId);
  }
login(data: any) {
  return this.http.post(`${this.API}/login`, data, { withCredentials: true });
}
logout() {
  return this.http.post(`${this.API}/logout`, {}, { withCredentials: true });
}


  register(data: any) {
    return this.http.post(`${this.API}/register`, data);
  }


  forgotPassword(email: string) {
    return this.http.post(`${this.API}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string) {
    return this.http.post(`${this.API}/verify-otp`, { email, otp });
  }

  resetPassword(data: any) {
  return this.http.post(
    'http://localhost:5000/api/auth/reset-password',
    data
  );
}


  verifyAccount(email: string, otp: string) {
    return this.http.post(`${this.API}/verify-account`, { email, otp });
  }
}
