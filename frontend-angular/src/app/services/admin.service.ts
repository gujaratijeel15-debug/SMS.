import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  users: number;
  providers: number;
  bookings: number;
  pendingProviders: number;
  messages: number;
  openMessages: number;
  reviews: number;
}

export interface AppService {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  status?: string;
  deactivationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private API = 'http://localhost:5000/api/admin';
  private SERVICE_API = 'http://localhost:5000/api/services';

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API}/stats`);
  }

  getUsers() {
    return this.http.get<any[]>(`${this.API}/users`);
  }

  deleteUser(id: string, reason: string) {
    return this.http.delete<{ message: string }>(`${this.API}/users/${id}`, {
      body: { reason }
    });
  }

  getProviders() {
    return this.http.get<any[]>(`${this.API}/providers`);
  }

  deleteProvider(id: string, reason: string) {
    return this.http.delete<{ message: string }>(`${this.API}/providers/${id}`, {
      body: { reason }
    });
  }

  approveProvider(id: string) {
    return this.http.put(`${this.API}/providers/${id}/approve`, {});
  }

  rejectProvider(id: string, reason: string) {
    return this.http.put(`${this.API}/providers/${id}/reject`, { reason });
  }

  toggleProviderAvailability(id: string) {
    return this.http.put(`${this.API}/providers/${id}/availability`, {});
  }

  getMessages(status: '' | 'open' | 'resolved' = '') {
    if (!status) {
      return this.http.get<any[]>(`${this.API}/messages`);
    }
    return this.http.get<any[]>(`${this.API}/messages?status=${status}`);
  }

  updateMessageStatus(id: string, status: 'open' | 'resolved') {
    return this.http.put<any>(`${this.API}/messages/${id}/status`, { status });
  }

  sendMessageReply(id: string, reply: string) {
    return this.http.post<any>(`${this.API}/messages/${id}/reply`, { reply });
  }

  getReviews() {
    return this.http.get<any[]>(`${this.API}/reviews`);
  }

  getActionHistory() {
    return this.http.get<any[]>(`${this.API}/action-history`);
  }

  getServices() {
    return this.http.get<AppService[]>(this.SERVICE_API);
  }

  createService(payload: {
    name: string;
    description?: string;
    price?: number;
    image?: string;
    status?: string;
    deactivationReason?: string;
  }) {
    return this.http.post<AppService>(this.SERVICE_API, payload);
  }

  updateService(
    id: string,
    payload: {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      status?: string;
      deactivationReason?: string;
    }
  ) {
    return this.http.put<AppService>(`${this.SERVICE_API}/${id}`, payload);
  }

  deleteService(id: string) {
    return this.http.delete<{ message: string }>(`${this.SERVICE_API}/${id}`);
  }
}
