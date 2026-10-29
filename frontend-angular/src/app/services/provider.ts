import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProviderService {

  private baseUrl = 'http://localhost:5000/api/bookings';

  constructor(private http: HttpClient) {}

  // 🔧 Get all bookings (existing)
  getBookings() {
    return this.http.get<any[]>(`${this.baseUrl}/provider`);
  }

  //

  rejectBooking(id: string, reason: string) {
    return this.http.put(`${this.baseUrl}/${id}/reject`, { reason });
  }

  getAvailability() {
    return this.http.get<any>(`${this.baseUrl}/provider/availability`);
  }

  toggleAvailability() {
    return this.http.put<any>(`${this.baseUrl}/provider/availability`, {});
  }

 
  // Provider profile endpoints
  getProfile() {
    return this.http.get<any>('http://localhost:5000/api/users/profile');
  }

  updateProfile(data: any) {
    return this.http.put<any>('http://localhost:5000/api/users/profile', data);
  }

  // pending bookings
  getPendingBookings() {
    return this.http.get(
      'http://localhost:5000/api/bookings/provider/pending'
    );
  }

  // accept
  acceptBooking(id: string) {
    return this.http.put(
      `http://localhost:5000/api/bookings/${id}/accept`,
      {}
    );
  }

  // active jobs
  getActiveJobs() {
    return this.http.get(
      'http://localhost:5000/api/bookings/provider/active'
    );
  }

  // complete job
  completeBooking(id: string) {
    return this.http.put(
      `http://localhost:5000/api/bookings/${id}/complete`,
      {}
    );
  }

  // job history
  getJobHistory() {
    return this.http.get<any[]>(
      'http://localhost:5000/api/bookings/provider/history'
    );
  }

  // dashboard stats
  getDashboardStats() {
    return this.http.get<any>(
      'http://localhost:5000/api/bookings/provider/stats'
    );
  }

  // notification count
getNotifications() {
  return this.http.get<any>(
    'http://localhost:5000/api/bookings/provider/notifications'
  );
}

// earnings
getEarnings() {
  return this.http.get<any>(
    'http://localhost:5000/api/bookings/provider/earnings'
  );
}



markPaymentPaid(id: string) {
  return this.http.put(
    `http://localhost:5000/api/bookings/${id}/mark-paid`,
    {}
  );
}
}