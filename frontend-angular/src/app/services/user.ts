import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {

  // Centralize your API URLs
  private BOOKING_API = 'https://sms-backend-jeel.onrender.com/api/bookings';
  private USER_API = 'https://sms-backend-jeel.onrender.com/api/users';

  // 🔥 1. THE BRAIN: Holds current user data so Navbar updates instantly
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Helper: Load initial user from browser memory
  private getUserFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }

  // --- BOOKING CALLS ---

  createBooking(payload: { serviceName: string; price: number; providerId?: string } | string) {
    const body = typeof payload === 'string'
      ? { serviceName: payload, price: 500 }
      : payload;

    return this.http.post(`${this.BOOKING_API}`, body, {
      withCredentials: true
    });
  }

  getMyBookings() {
    return this.http.get<any[]>(`${this.BOOKING_API}/my`, {
      withCredentials: true
    });
  }

  // 🔥 New: Allow cancelling a booking
cancelBooking(id: string) {
  return this.http.delete(
    `https://sms-backend-jeel.onrender.com/api/bookings/${id}`
  );
}


chooseCashPayment(id: string) {
  return this.http.post(
    `https://sms-backend-jeel.onrender.com/api/bookings/${id}/cash-payment`,
    {}
  );
}


  // --- USER PROFILE CALLS ---

getProfile() {
  return this.http.get<any>(
    'https://sms-backend-jeel.onrender.com/api/users/profile'
  );
}

updateProfile(data: any) {
  return this.http.put(
    'https://sms-backend-jeel.onrender.com/api/users/profile',
    data
  );
}

  // 🔥 UPDATED: Update Profile & Notify the Navbar


  changePassword(data: any) {
    return this.http.put(`${this.USER_API}/change-password`, data);
  }

  submitReview(bookingId: string, payload: { rating: number; response: string }) {
    return this.http.put(
      `https://sms-backend-jeel.onrender.com/api/bookings/${bookingId}/review`,
      payload
    );
  }
}
